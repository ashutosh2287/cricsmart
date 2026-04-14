import { startSimulation } from "@/services/simulation/matchSimulator";
import type { SimulationState } from "@/services/simulation/simulationState";
import { teams } from "@/data/teams";
import type { Player as TeamPlayer } from "@/data/teams";
import { initMatch } from "@/services/matchEngine";
export const runtime = "nodejs";


export async function POST(req: Request) {
  try {
    const { matchId, teamAName, teamBName } = await req.json();
    console.log("🆔 API MATCH ID:", matchId);
    console.log("🔥 Teams received:", teamAName, "vs", teamBName);

    console.log("🚀 Starting simulation on server:", matchId);
    console.log("🔥 FINAL TEAMS:", teamAName, "vs", teamBName);

    

    // 🔥 USE squad INSTEAD OF players
   
const teamA = teams.find(t => t.name === teamAName);
const teamB = teams.find(t => t.name === teamBName);

if (!teamA || !teamB) {
  console.error("❌ Invalid teams received");
  return Response.json({ success: false }, { status: 400 });
}
const batting = mapToSimulationPlayers(teamA.squad);
const bowling = mapToSimulationPlayers(teamB.squad);

const state: SimulationState = {
  over: 0,
  ball: 0,

  totalRuns: 0,
  wickets: 0,

  striker: batting[0],
  nonStriker: batting[1],
  bowler: bowling[0],

  battingOrder: batting,
  nextBatsmanIndex: 2,

  bowlingOrder: bowling,
  currentBowlerIndex: 0,

  teamA,
  teamB,

  tossWinner: teamA.name,
  decision: "BAT",

  currentInningsIndex: 0,

  matchEnded: false,
  winner: null,
  winBy: null,

  battingTeam: teamA,
  bowlingTeam: teamB,

  phase: "POWERPLAY",
};
    // ✅ INIT ENGINE FIRST (CRITICAL FIX)
initMatch(matchId);

// 🔥 START SIMULATION
startSimulation(state, matchId, 1500);
    

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to start simulation", err);
    return Response.json({ success: false }, { status: 500 });
  }
}
function mapToSimulationPlayers(players: TeamPlayer[]) {
  return players.map((p) => ({
    name: p.name,
    role: p.role,
    stats: {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      runsConceded: 0,
      ballsBowled: 0,
    },
  }));
}