import { NextRequest, NextResponse } from "next/server";
import { initMatch, getMatchState } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { SimulationState } from "@/services/simulation/simulationState";
import { startSimulation } from "@/services/simulation/matchSimulator";

/* ========================= */
/* HELPER */
/* ========================= */

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

/* ========================= */
/* API */
/* ========================= */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { matchId, teamA, teamB, type } = body;

    if (!matchId || !teamA || !teamB) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    console.log("🚀 INIT MATCH:", matchId);

    /* ENGINE INIT */
    initMatch(matchId);

    const state = getMatchState(matchId);

    if (!state) {
      throw new Error("Failed to initialize match state");
    }

    /* SAVE TO REDIS */
    const storage = new RedisSimulationStorage();

    await storage.save(matchId, state, {
      isRunning: false,
      isPaused: false,
      speed: 1500,
    });

    /* 🔥 ONLY START SIMULATION IF NEEDED */
    if (type === "SIMULATION") {
      const teamAObj = createTeam(teamA);
      const teamBObj = createTeam(teamB);

      const simState: SimulationState = {
        teamA: teamAObj,
        teamB: teamBObj,

        tossWinner: teamA,
        decision: "BAT",

        battingTeam: teamAObj,
        bowlingTeam: teamBObj,

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
    }

    return NextResponse.json({
      success: true,
      matchId,
    });
  } catch (error) {
    console.error("❌ INIT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to init match" },
      { status: 500 }
    );
  }
}