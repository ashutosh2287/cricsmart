import { Team } from "@/data/teams";

export function runToss(teamA: Team, teamB: Team) {
  const winner = Math.random() < 0.5 ? teamA : teamB;

  return {
    winner,
  };
}