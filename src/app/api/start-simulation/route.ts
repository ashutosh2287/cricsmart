import {
  startSimulation,
  isSimulationRunning,
} from "@/services/simulation/matchSimulator";
import type { SimulationState } from "@/services/simulation/simulationState";
import { teams } from "@/data/teams";
import {
  getMatchState,
  hydrateMatchState,
  MatchState,
} from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

export const runtime = "nodejs";

const startLocks = new Set<string>();

type StartSimulationBody = {
  matchId?: string;
  teamAName?: string;
  teamBName?: string;
  tossWinner?: string;
  tossDecision?: "BAT" | "BOWL";
};

// ==============================
// 🔧 HELPER: Normalize team names (case-insensitive)
// ==============================
function normalizeTeamName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return name.toLowerCase().trim();
}

export async function POST(req: Request) {
  let lockedMatchId: string | undefined;

  try {
    const body = (await req.json()) as StartSimulationBody;

    const matchId = body?.matchId?.trim();
    const teamAName = body?.teamAName?.trim();
    const teamBName = body?.teamBName?.trim();
    const tossWinner = body?.tossWinner?.trim();
    const tossDecision = body?.tossDecision;

    // ==============================
    // ✅ VALIDATION
    // ==============================
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

    // ==============================
    // 🔒 LOCK CHECK
    // ==============================
    if (startLocks.has(matchId) || isSimulationRunning(matchId)) {
      return Response.json(
        { success: true, alreadyRunning: true, matchId },
        { status: 200 }
      );
    }

    startLocks.add(matchId);
    lockedMatchId = matchId;

    // ==============================
    // 🏏 GET TEAMS
    // ==============================
    const teamA = teams.find((t) => t.name === teamAName);
    const teamB = teams.find((t) => t.name === teamBName);

    if (!teamA || !teamB) {
      return Response.json(
        { success: false, error: `Invalid teams: ${teamAName} vs ${teamBName}` },
        { status: 400 }
      );
    }

    // ==============================
    // 🎯 NORMALIZE TOSS (FIX: CASE-INSENSITIVE)
    // ==============================
    const tossWinnerNormalized = normalizeTeamName(tossWinner);
    const teamANameNormalized = normalizeTeamName(teamA.name);
    const teamBNameNormalized = normalizeTeamName(teamB.name);

    let normalizedTossWinner: string | undefined;

    if (tossWinnerNormalized === teamANameNormalized) {
      normalizedTossWinner = teamA.name; // Use original casing
    } else if (tossWinnerNormalized === teamBNameNormalized) {
      normalizedTossWinner = teamB.name; // Use original casing
    }

    if (!normalizedTossWinner) {
      console.error(
        `❌ Toss winner mismatch. Received: "${tossWinner}", teamA: "${teamA.name}", teamB: "${teamB.name}"`
      );
      return Response.json(
        {
          success: false,
          error: `Invalid tossWinner: ${tossWinner}. Expected "${teamA.name}" or "${teamB.name}"`,
        },
        { status: 400 }
      );
    }

    // ==============================
    // 🔥 LOAD STATE (ENGINE / REDIS)
    // ==============================
    let existingState = getMatchState(matchId);

    if (!existingState) {
      const storage = new RedisSimulationStorage();
      const stored = await storage.load(matchId);

      if (!stored?.state) {
        return Response.json(
          { success: false, error: "Match not found in storage" },
          { status: 400 }
        );
      }

      hydrateMatchState(matchId, stored.state);
      existingState = getMatchState(matchId);
    }

    if (!existingState) {
      return Response.json(
        { success: false, error: "Failed to hydrate match state" },
        { status: 500 }
      );
    }

    // ==============================
    // 🧠 UPDATE TEAMS
    // ==============================
    existingState.teamA = teamA;
    existingState.teamB = teamB;

    // ==============================
    // 🔥 FIX: NORMALIZE OLD "Team A/B"
    // ==============================
    existingState.innings.forEach((inning) => {
      if (inning.battingTeam === "Team A") {
        inning.battingTeam = teamA.name;
      }
      if (inning.battingTeam === "Team B") {
        inning.battingTeam = teamB.name;
      }

      if (inning.bowlingTeam === "Team A") {
        inning.bowlingTeam = teamA.name;
      }
      if (inning.bowlingTeam === "Team B") {
        inning.bowlingTeam = teamB.name;
      }
    });

    existingState.tossWinner = normalizedTossWinner;
    existingState.decision = tossDecision;

    // ==============================
    // 🏏 DECIDE FIRST INNINGS
    // ==============================
    const battingTeam =
      tossDecision === "BAT"
        ? normalizedTossWinner
        : normalizedTossWinner === teamA.name
        ? teamB.name
        : teamA.name;

    const bowlingTeam =
      battingTeam === teamA.name ? teamB.name : teamA.name;

    console.log("🏏 TOSS RESULT", {
      tossWinner: normalizedTossWinner,
      decision: tossDecision,
      battingTeam,
      bowlingTeam,
    });

    // ==============================
    // 🔥 SAFE INNINGS UPDATE (NO ARRAY RESET)
    // ==============================
    if (existingState.innings?.length > 0) {
      existingState.innings[0].battingTeam = battingTeam;
      existingState.innings[0].bowlingTeam = bowlingTeam;
    }

    // ==============================
    // 🎮 SIMULATION STATE
    // ==============================
    const initialState: SimulationState = {
      teamA,
      teamB,
      tossWinner: normalizedTossWinner,
      decision: tossDecision,

      // 🔥 FIXED (NO HARDCODE)
      battingTeam: battingTeam === teamA.name ? teamA : teamB,

      bowlingTeam: bowlingTeam === teamA.name ? teamA : teamB,

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

    // ==============================
    // 🚀 START SIMULATION
    // ==============================
    const result = await startSimulation(initialState, matchId, 1500);

    if (!result.started && !result.alreadyRunning) {
      return Response.json(
        { success: false, error: result.reason ?? "Failed to start simulation" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      alreadyRunning: result.alreadyRunning,
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
