import { Team } from "@/data/teams";

export type SimulationState = {
  over: number;
  ball: number;

  totalRuns: number;
  wickets: number;

  striker: string;
  nonStriker: string;
  bowler: string;

  battingOrder: string[];
  nextBatsmanIndex: number;

  // 🔥 NEW
  bowlingOrder: string[];
  currentBowlerIndex: number;

  // 🔥 TARGET MODE
  target?: number;
  teamA: Team;
  teamB: Team;

  tossWinner: string;          // team name
  decision: "BAT" | "BOWL";   // toss decision
  currentInningsIndex: number; // 0 or 1

  lastOverUpdated?: number;
  bowlingPlan?: string[];

  matchEnded: boolean;
  winner: string | null;
  winBy: string | null;

  battingTeam: Team;
  bowlingTeam: Team;

  phase: "POWERPLAY" | "MIDDLE" | "DEATH";
};