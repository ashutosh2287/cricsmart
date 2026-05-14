import { NextRequest, NextResponse } from "next/server";
import {
  getMatchState,
  hydrateMatchState,
  initMatch,
} from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { SimulationState } from "@/services/simulation/simulationState";
import { startSimulation } from "@/services/simulation/matchSimulator";
import { startMatch } from "@/services/match/matchManager";
import { initPlayerRegistry } from "@/services/player/playerRegistry";
import {
  findLiveMatchSession,
  markMatchFailed,
  registerLiveMatchSession,
  type MatchRegistryRecord,
  upsertMatchRegistry,
} from "@/services/match/matchRegistry";
import {
  createLiveMatchId,
  createMatchId,
} from "@/services/match/createLiveMatchId";
import {
  startLiveMatchSession,
} from "@/services/ingestion/liveMatchIngestor";
import type {
  LiveMatchInitPayload,
  LiveMatchInitResponse,
  LiveSessionProvider,
} from "@/types/liveSession";

const DEFAULT_LIVE_PROVIDER: LiveSessionProvider = "cricapi";

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

function createLiveEngineState(
  matchId: string,
  teamA: string,
  teamB: string,
  format: "T20" | "ODI" | "TEST" = "T20"
) {
  initMatch(matchId, format);
  const base = getMatchState(matchId);

  if (!base) {
    throw new Error("Failed to initialize live match state");
  }

  const next = structuredClone(base);
  next.teamA = createTeam(teamA);
  next.teamB = createTeam(teamB);
  next.tossWinner = teamA;
  next.decision = "BAT";

  if (next.innings[0]) {
    next.innings[0].battingTeam = teamA;
    next.innings[0].bowlingTeam = teamB;
    next.innings[0].striker = "";
    next.innings[0].nonStriker = "";
    next.innings[0].currentBowler = "";
    next.innings[0].battingOrder = [];
    next.innings[0].nextBatsmanIndex = 2;
  }

  if (next.innings[1]) {
    next.innings[1].battingTeam = teamB;
    next.innings[1].bowlingTeam = teamA;
    next.innings[1].striker = "";
    next.innings[1].nonStriker = "";
    next.innings[1].currentBowler = "";
    next.innings[1].battingOrder = [];
    next.innings[1].nextBatsmanIndex = 2;
  }

  hydrateMatchState(matchId, next);
  return next;
}

async function ensureHydratedFromStorage(matchId: string) {
  if (getMatchState(matchId)) return;

  const storage = new RedisSimulationStorage();
  const stored = await storage.load(matchId);
  if (stored?.state) {
    hydrateMatchState(matchId, stored.state);
  }
}

async function initSimulationMatch(body: {
  matchId?: string;
  teamA?: string;
  teamB?: string;
  type?: "SIMULATION" | "LIVE";
  externalMatchId?: string;
  tossWinner?: string;
  decision?: "BAT" | "BOWL";
}) {
  const teamA = body.teamA?.trim();
  const teamB = body.teamB?.trim();
  const matchId = body.matchId?.trim() || (teamA && teamB ? createMatchId(teamA, teamB) : undefined);

  if (!matchId || !teamA || !teamB) {
    return NextResponse.json(
      { success: false, message: "Missing fields" },
      { status: 400 }
    );
  }

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
    slug: matchId,
    teamA,
    teamB,
    type: "SIMULATION",
    status: "UPCOMING",
    externalMatchId: body.externalMatchId,
    isLiveConnected: false,
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
  });

  if (!existing) {
    const teamAObj = createTeam(teamA);
    const teamBObj = createTeam(teamB);
    const resolvedTossWinner = body.tossWinner ?? teamA;
    const resolvedDecision = body.decision ?? "BAT";

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

    await startSimulation(simState, matchId, 300);

    await upsertMatchRegistry({
      matchId,
      slug: matchId,
      teamA,
      teamB,
      type: "SIMULATION",
      status: "LIVE",
      isLiveConnected: true,
      heartbeatFresh: true,
      reconnectHealth: "healthy",
    });
  }

  return NextResponse.json({
    success: true,
    matchId,
    slug: matchId,
    sessionState: "ACTIVE",
    alreadyInitialized: Boolean(existing),
  });
}

async function initLiveMatch(payload: LiveMatchInitPayload) {
  const teamA = payload.teamA?.trim();
  const teamB = payload.teamB?.trim();
  const externalMatchId = payload.externalMatchId?.trim();
  const provider = payload.provider ?? DEFAULT_LIVE_PROVIDER;

  if (!teamA || !teamB || !externalMatchId) {
    return NextResponse.json(
      { success: false, message: "externalMatchId, teamA, and teamB are required" },
      { status: 400 }
    );
  }

  if (!process.env.CRICKET_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Missing server-side CRICKET_API_KEY for live provider integration",
      },
      { status: 400 }
    );
  }

  let targetSession: MatchRegistryRecord | null = null;
  let createdMatchId: string | null = null;

  try {
    targetSession = await findLiveMatchSession({ externalMatchId, provider });

    if (targetSession) {
      startMatch(targetSession.matchId);
      initPlayerRegistry(targetSession.matchId);
      await ensureHydratedFromStorage(targetSession.matchId);

      startLiveMatchSession(targetSession.matchId, externalMatchId);

      const response: LiveMatchInitResponse = {
        success: true,
        matchId: targetSession.matchId,
        slug: targetSession.slug ?? targetSession.matchId,
        sessionState: "ACTIVE",
      };

      return NextResponse.json(response);
    }

    const created = createLiveMatchId({
      teamA,
      teamB,
      provider,
      uniqueSeed: payload.scheduledStart ?? Date.now(),
    });

    const matchId = created.matchId;
    createdMatchId = matchId;
    const format = payload.format ?? "T20";

    startMatch(matchId);
    initPlayerRegistry(matchId);

    const initialState = createLiveEngineState(matchId, teamA, teamB, format);
    const storage = new RedisSimulationStorage();

    await storage.save(matchId, initialState, {
      isRunning: true,
      isPaused: false,
      speed: 1500,
    });

    await registerLiveMatchSession({
      matchId,
      slug: created.slug,
      externalMatchId,
      provider,
      teamA,
      teamB,
      seriesName: payload.seriesName,
      format,
      scheduledStart: payload.scheduledStart,
      sessionState: "INITIALIZING",
    });

    startLiveMatchSession(matchId, externalMatchId);

    const response: LiveMatchInitResponse = {
      success: true,
      matchId,
      slug: created.slug,
      sessionState: "ACTIVE",
    };

    return NextResponse.json(response);
  } catch (error) {
    const failedMatchId = targetSession?.matchId ?? createdMatchId;
    if (failedMatchId) {
      await markMatchFailed(
        failedMatchId,
        error instanceof Error ? error.message : "Live session bootstrap failed"
      );
    }

    console.error("❌ LIVE INIT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to bootstrap live match",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type === "SIMULATION" ? "SIMULATION" : "LIVE";

    if (type === "SIMULATION") {
      return await initSimulationMatch(body as {
        matchId?: string;
        teamA?: string;
        teamB?: string;
        type?: "SIMULATION" | "LIVE";
        externalMatchId?: string;
        tossWinner?: string;
        decision?: "BAT" | "BOWL";
      });
    }

    return await initLiveMatch({
      externalMatchId: body?.externalMatchId,
      provider: body?.provider ?? DEFAULT_LIVE_PROVIDER,
      teamA: body?.teamA,
      teamB: body?.teamB,
      seriesName: body?.seriesName,
      format: body?.format,
      scheduledStart: body?.scheduledStart,
    });
  } catch (error) {
    console.error("❌ INIT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to init match" },
      { status: 500 }
    );
  }
}
