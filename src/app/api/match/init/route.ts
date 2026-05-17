import { NextRequest, NextResponse } from "next/server";
import { initMatch, getMatchState } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { SimulationState } from "@/services/simulation/simulationState";
import { startSimulation } from "@/services/simulation/matchSimulator";
import { startMatch } from "@/services/match/matchManager";
import { startLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import { startWorker } from "@/services/queue/eventWorker";
import { initPlayerRegistry } from "@/services/player/playerRegistry";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";
import { getProviderMode } from "@/config/providerMode";
import { logger } from "@/lib/logger";
import type { SessionSourceType } from "@/types/liveSession";
import { ensureSessionRecoveryStarted } from "@/services/runtime/sessionRecoveryBootstrap";
import { transitionSimulationLifecycle } from "@/services/simulation/simulation-orchestrator";

const DEFAULT_SIMULATION_SPEED_MS = 300;

const createTeam = (name: string) => ({
  name,
  short: name.slice(0, 3).toUpperCase(),
  squad: [
    { name: "Player 1", role: "BAT" as const },
    { name: "Player 2", role: "BAT" as const },
    { name: "Player 3", role: "BAT" as const },
    { name: "Player 4", role: "BAT" as const },
    { name: "Player 5", role: "AR" as const },
    { name: "Player 6", role: "AR" as const },
    { name: "Player 7", role: "WK" as const },
    { name: "Player 8", role: "BOWL" as const },
    { name: "Player 9", role: "BOWL" as const },
    { name: "Player 10", role: "BOWL" as const },
    { name: "Player 11", role: "BOWL" as const },
  ],
});

export async function POST(req: NextRequest) {
  ensureSessionRecoveryStarted();

  try {
    const body = await req.json();

    const {
      matchId,
      teamA,
      teamB,
      type,
      externalMatchId,
      tossWinner,
      decision,
    } = body as {
      matchId?: string;
      teamA?: string;
      teamB?: string;
      type?: "SIMULATION" | "LIVE";
      externalMatchId?: string;
      tossWinner?: string;
      decision?: "BAT" | "BOWL";
    };

    if (!matchId || !teamA || !teamB) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const matchType = type === "LIVE" ? "LIVE" : "SIMULATION";
    const providerMode = getProviderMode();
    const sourceType: SessionSourceType =
      matchType === "SIMULATION"
        ? "SIMULATION"
        : providerMode === "mock"
          ? "MOCK"
          : providerMode === "simulation"
            ? "SIMULATION"
            : "LIVE";

    startMatch(matchId);
    initPlayerRegistry(matchId);
    initMatch(matchId);

    const state = getMatchState(matchId);
    if (!state) {
      throw new Error("Failed to initialize match state");
    }

    const storage = new RedisSimulationStorage();
    const existing = await storage.load(matchId);

    if (!existing) {
      await storage.save(matchId, state, {
        isRunning: false,
        isPaused: false,
        speed: 1500,
      });
    }

    await upsertMatchRegistry({
      matchId,
      teamA,
      teamB,
      type: matchType,
      status: matchType === "LIVE" ? "LIVE" : "UPCOMING",
      externalMatchId,
      sourceType,
      isLiveConnected: matchType === "LIVE",
      heartbeatFresh: false,
      reconnectHealth: matchType === "LIVE" ? "stale" : "disconnected",
    });

    if (matchType === "SIMULATION") {
      await transitionSimulationLifecycle(
        matchId,
        tossWinner && decision ? "READY" : "CONFIGURING"
      );
    }

    if (matchType === "LIVE") {
      if (providerMode === "simulation" && !existing) {
        const teamAObj = createTeam(teamA);
        const teamBObj = createTeam(teamB);
        const resolvedTossWinner = tossWinner ?? teamA;
        const resolvedDecision = decision ?? "BAT";

        const simState: SimulationState = {
          teamA: teamAObj,
          teamB: teamBObj,
          tossWinner: resolvedTossWinner,
          decision: resolvedDecision,
          battingTeam:
            resolvedDecision === "BAT"
              ? resolvedTossWinner === teamA
                ? teamAObj
                : teamBObj
              : resolvedTossWinner === teamA
                ? teamBObj
                : teamAObj,
          bowlingTeam:
            resolvedDecision === "BAT"
              ? resolvedTossWinner === teamA
                ? teamBObj
                : teamAObj
              : resolvedTossWinner === teamA
                ? teamAObj
                : teamBObj,
          striker: "",
          nonStriker: "",
          bowler: "",
          battingOrder: [],
          bowlingOrder: [],
          bowlingPlan: [],
          nextBatsmanIndex: 2,
          currentBowlerIndex: 0,
          over: 0,
          ball: 0,
          totalRuns: 0,
          wickets: 0,
          currentInningsIndex: 0,
          phase: "POWERPLAY",
          matchEnded: false,
          winner: null,
          winBy: null,
        };

        await startSimulation(simState, matchId, DEFAULT_SIMULATION_SPEED_MS);
        logger.info("PROVIDER", "session_using_simulation_provider", {
          matchId,
          providerMode,
        });
      } else {
        const resolvedExternalMatchId = externalMatchId ?? matchId;

        if (providerMode === "cricketdata" && !process.env.CRICKET_API_KEY) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Missing server-side CRICKET_API_KEY for live provider integration",
            },
            { status: 400 }
          );
        }

        startWorker(matchId);
        startLiveMatchIngestor(matchId, resolvedExternalMatchId);
      }
    }

    return NextResponse.json({
      success: true,
      matchId,
      alreadyInitialized: Boolean(existing),
    });
  } catch (error) {
    console.error("❌ INIT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to init match" },
      { status: 500 }
    );
  }
}
