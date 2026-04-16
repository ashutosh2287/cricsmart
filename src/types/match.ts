import type { MatchState } from "@/services/matchEngine";

export type MatchStatus = "Live" | "Upcoming" | "Completed";

export type Match = {
  currentBall: number;
  currentOver: number;
  id: string;
  slug: string;
  team1: string;
  team2: string;
  status: MatchStatus;

  score?: string;
  overs?: string;
  runRate?: number;
  balls?: number;

  externalMatchId?: string;
  engineState?: MatchState;
};