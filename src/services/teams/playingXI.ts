import { Team, Player } from "@/data/teams";

export type PlayingXI = {
  team: string;
  players: Player[];
};

// ✅ Auto pick best XI (simple logic)
export function getPlayingXI(team: Team): PlayingXI {
  const batsmen = team.squad.filter(p => p.role === "BAT");
  const bowlers = team.squad.filter(p => p.role === "BOWL");
  const allRounders = team.squad.filter(p => p.role === "AR");
  const wicketKeepers = team.squad.filter(p => p.role === "WK");

  const selected: Player[] = [];

  // 1. Top order batsmen (4)
  selected.push(...batsmen.slice(0, 4));

  // 2. 1 WK
  if (wicketKeepers.length > 0) {
    selected.push(wicketKeepers[0]);
  }

  // 3. All-rounders (2)
  selected.push(...allRounders.slice(0, 2));

  // 4. Bowlers (4)
  selected.push(...bowlers.slice(0, 4));

  return {
    team: team.name,
    players: selected.slice(0, 11),
  };
}