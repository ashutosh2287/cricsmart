import { Player } from "@/data/teams";

export function getBowlingOrder(players: Player[]): string[] {
  const bowlers = players.filter(p => p.role === "BOWL");
  const allRounders = players.filter(p => p.role === "AR");

  // Priority: bowlers first, then all-rounders
  return [...bowlers, ...allRounders].map(p => p.name);
}