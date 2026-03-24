import { Player } from "@/data/teams";

// ✅ Smart batting order
export function getBattingOrder(players: Player[]): string[] {
  const batsmen = players.filter(p => p.role === "BAT");
  const allRounders = players.filter(p => p.role === "AR");
  const wicketKeepers = players.filter(p => p.role === "WK");
  const bowlers = players.filter(p => p.role === "BOWL");

  return [
    ...batsmen,          // top order
    ...wicketKeepers,    // middle
    ...allRounders,      // lower middle
    ...bowlers           // tail
  ].map(p => p.name);
}