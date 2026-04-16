import {
  startSimulation,
  isSimulationRunning,
} from "@/services/simulation/matchSimulator";
import type { SimulationState } from "@/services/simulation/simulationState";
import { teams } from "@/data/teams";
import { initMatch, getMatchState } from "@/services/matchEngine";

export const runtime = "nodejs";

const startLocks = new Set<string>();

type StartSimulationBody = {
  matchId?: string;
  teamAName?: string;
  teamBName?: string;
  tossWinner?: string;
  tossDecision?: "BAT" | "BOWL";
};

export async function POST(req: Request) {
  let lockedMatchId: string | undefined;

  try {
    const body = (await req.json()) as StartSimulationBody;

    const matchId = body?.matchId?.trim();
    const teamAName = body?.teamAName?.trim();
    const teamBName = body?.teamBName?.trim();
    const tossWinner = body?.tossWinner?.trim();
    const tossDecision = body?.tossDecision;

    if (!matchId) {
      return Response.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    if (!teamAName || !teamBName) {
      return Response.json(
        { success: false, error: "teamAName and teamBName are required" },
        { status: 400 }
      );
    }

    if (!tossWinner || !tossDecision) {
      return Response.json(
        { success: false, error: "tossWinner and tossDecision are required" },
        { status: 400 }
      );
    }

    if (startLocks.has(matchId)) {
      return Response.json(
        {
          success: true,
          alreadyRunning: true,
          matchId,
        },
        { status: 200 }
      );
    }

    if (isSimulationRunning(matchId)) {
      return Response.json(
        {
          success: true,
          alreadyRunning: true,
          matchId,
        },
        { status: 200 }
      );
    }

    startLocks.add(matchId);
    lockedMatchId = matchId;

    let existingState = getMatchState(matchId);
    if (!existingState) {
      initMatch(matchId);
      existingState = getMatchState(matchId);
    }

    if (!existingState) {
      return Response.json(
        { success: false, error: "Failed to initialize match state" },
        { status: 500 }
      );
    }

    const teamA = teams.find((team) => team.name === teamAName);
    const teamB = teams.find((team) => team.name === teamBName);

    if (!teamA || !teamB) {
      return Response.json(
        {
          success: false,
          error: `Invalid teams provided: ${teamAName} vs ${teamBName}`,
        },
        { status: 400 }
      );
    }

    const normalizedTossWinner =
      tossWinner === teamA.name
        ? teamA.name
        : tossWinner === teamB.name
          ? teamB.name
          : undefined;

    if (!normalizedTossWinner) {
      return Response.json(
        {
          success: false,
          error: `Invalid tossWinner: ${tossWinner}`,
        },
        { status: 400 }
      );
    }

    const initialState: SimulationState = {
  teamA,
  teamB,
  tossWinner: normalizedTossWinner,
  decision: tossDecision,
  battingTeam: teamA,
  bowlingTeam: teamB,
  battingOrder: [],
  bowlingOrder: [],
  striker: null as never,
  nonStriker: null as never,
  bowler: null as never,
  nextBatsmanIndex: 0,
  currentBowlerIndex: 0,
  bowlingPlan: [],
  over: 0,
  ball: 0,
  totalRuns: 0,
  wickets: 0,
  currentInningsIndex: 0,
  target: 0,
  phase: "POWERPLAY",
  matchEnded: false,
  winner: null,
  winBy: null,
};

    const result = startSimulation(initialState, matchId, 1500);

    if (!result?.started && !result?.alreadyRunning) {
      return Response.json(
        {
          success: false,
          error: result?.reason ?? "Failed to start simulation",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      alreadyRunning: !!result?.alreadyRunning,
      matchId,
    });
  } catch (err) {
    console.error("❌ Failed to start simulation", err);

    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to start simulation",
      },
      { status: 500 }
    );
  } finally {
    if (lockedMatchId) {
      startLocks.delete(lockedMatchId);
    }
  }
}