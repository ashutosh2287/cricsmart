import { Player } from "@/data/teams";

export function getBattingOrder(players: Player[]): string[] {
  const batsmen = players.filter(p => p.role === "BAT");
  const allRounders = players.filter(p => p.role === "AR");
  const wicketKeepers = players.filter(p => p.role === "WK");
  const bowlers = players.filter(p => p.role === "BOWL");

  return [
    ...batsmen,
    ...wicketKeepers,
    ...allRounders,
    ...bowlers,
  ].map(p => p.name);
}

export function getBowlingOrder(players: Player[]): string[] {
  const bowlers = players.filter(p => p.role === "BOWL");
  const allRounders = players.filter(p => p.role === "AR");

  return [...bowlers, ...allRounders].map(p => p.name);
}