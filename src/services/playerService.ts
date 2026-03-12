import { Player } from "@/types/player";

const players: Player[] = [

  {
    id: "kohli",
    name: "Virat Kohli",
    team: "India",
    role: "Batsman",
    battingAverage: 58.1,
    strikeRate: 92.4,
    matches: 274,
    impactScore: 94
  },

  {
    id: "babar",
    name: "Babar Azam",
    team: "Pakistan",
    role: "Batsman",
    battingAverage: 54.2,
    strikeRate: 89.7,
    matches: 117,
    impactScore: 91
  },

  {
    id: "root",
    name: "Joe Root",
    team: "England",
    role: "Batsman",
    battingAverage: 50.3,
    strikeRate: 86.2,
    matches: 165,
    impactScore: 90
  },

  {
    id: "cummins",
    name: "Pat Cummins",
    team: "Australia",
    role: "Bowler",
    bowlingAverage: 24.6,
    economy: 4.8,
    matches: 84,
    impactScore: 88
  }

];

export function getPlayers() {
  return players;
}

export function getPlayerById(id: string) {
  return players.find(p => p.id === id);
}