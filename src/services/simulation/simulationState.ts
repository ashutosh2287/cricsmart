import { Team } from "@/data/teams";

/* =====================================================
   🧠 PLAYER TYPE (NEW CORE)
===================================================== */

export type PlayerStats = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets?: number;
  runsConceded?: number;
  ballsBowled?: number;
};

export type Player = {
  name: string;
  role: string;
  stats: PlayerStats;
};

/* =====================================================
   🔁 LEGACY SUPPORT (IMPORTANT)
===================================================== */

// Allow both string and Player (for gradual migration)
export type PlayerRef = string | Player;

/* =====================================================
   🏏 SIMULATION STATE
===================================================== */

export type SimulationState = {
  over: number;
  ball: number;

  totalRuns: number;
  wickets: number;

  // 🔥 NOW SUPPORTS OBJECTS
  striker: PlayerRef;
  nonStriker: PlayerRef;
  bowler: PlayerRef;

  battingOrder: PlayerRef[];
  nextBatsmanIndex: number;

  bowlingOrder: PlayerRef[];
  currentBowlerIndex: number;

  // 🎯 TARGET MODE
  target?: number;

  teamA: Team;
  teamB: Team;

  tossWinner: string;
  decision: "BAT" | "BOWL";
  currentInningsIndex: number;

  lastOverUpdated?: number;
  bowlingPlan?: string[]; // keep as string for now (safe)

  matchEnded: boolean;
  winner: string | null;
  winBy: string | null;

  battingTeam: Team;
  bowlingTeam: Team;

  phase: "POWERPLAY" | "MIDDLE" | "DEATH";
};