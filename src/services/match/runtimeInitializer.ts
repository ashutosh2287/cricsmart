import { initMatch, getMatchState } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { SimulationState } from "@/services/simulation/simulationState";
import { startSimulation } from "@/services/simulation/matchSimulator";
import { startMatch } from "@/services/match/matchManager";
import { initPlayerRegistry } from "@/services/player/playerRegistry";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";
import { bootstrapLiveSession } from "@/services/live/liveSessionOrchestrator";
import { getProviderMode } from "@/config/providerMode";
import { logger } from "@/lib/logger";
import type { SessionSourceType } from "@/types/liveSession";

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

function createInitialSimulationState(
  teamA: string,
  teamB: string,
  tossWinner?: string,
  decision?: "BAT" | "BOWL"
): SimulationState {
  const teamAObj = createTeam(teamA);
  const teamBObj = createTeam(teamB);
  const resolvedTossWinner = tossWinner ?? teamA;
  const resolvedDecision = decision ?? "BAT";

  return {
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
}

export type InitializeRuntimeMatchInput = {
  matchId: string;
  teamA: string;
  teamB: string;
  type?: "SIMULATION" | "LIVE";
  externalMatchId?: string;
  tossWinner?: string;
  decision?: "BAT" | "BOWL";
};

export async function initializeRuntimeMatch(
  input: InitializeRuntimeMatchInput
): Promise<{ matchId: string; alreadyInitialized: boolean }> {
  const {
    matchId,
    teamA,
    teamB,
    type,
    externalMatchId,
    tossWinner,
    decision,
  } = input;

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

  if (matchType === "SIMULATION" && !existing) {
    const simState = createInitialSimulationState(teamA, teamB, tossWinner, decision);
    await startSimulation(simState, matchId, DEFAULT_SIMULATION_SPEED_MS);

    await upsertMatchRegistry({
      matchId,
      teamA,
      teamB,
      type: "SIMULATION",
      sourceType: "SIMULATION",
      status: "LIVE",
      isLiveConnected: true,
      heartbeatFresh: true,
      reconnectHealth: "healthy",
    });
  }

  if (matchType === "LIVE") {
    const resolvedExternalMatchId = externalMatchId ?? matchId;

    if (providerMode === "cricketdata") {
      if (!process.env.CRICKET_API_KEY) {
        throw new Error("Missing server-side CRICKET_API_KEY for live provider integration");
      }

      await bootstrapLiveSession({
        matchId,
        teamA,
        teamB,
        externalMatchId: resolvedExternalMatchId,
      });
    }

    if (providerMode === "simulation" && !existing) {
      const simState = createInitialSimulationState(teamA, teamB, tossWinner, decision);
      await startSimulation(simState, matchId, DEFAULT_SIMULATION_SPEED_MS);
      logger.info("PROVIDER", "session_using_simulation_provider", {
        matchId,
        providerMode,
      });
    }
  }

  return {
    matchId,
    alreadyInitialized: Boolean(existing),
  };
}