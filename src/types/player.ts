export type PlayerRole =
  | "Batsman"
  | "Bowler"
  | "All-Rounder"
  | "Wicketkeeper";

export type Player = {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;

  battingAverage?: number;
  strikeRate?: number;

  bowlingAverage?: number;
  economy?: number;

  matches: number;

  impactScore?: number;
};