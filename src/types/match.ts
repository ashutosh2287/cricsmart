import type { MatchState } from "@/services/matchEngine";

export type Match = {

  slug: string;
  team1: string;
  team2: string;
  status: "Live" | "Upcoming" | "Completed";

  score?: string;
  overs?: string;
  runRate?: number;
  id: string;

  // ⭐ engine state (hidden simulation data)
  balls?: number;
  // external cricket API match id
  externalMatchId?: string

  engineState?: MatchState;

};