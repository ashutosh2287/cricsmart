import { Match } from "../types/match";

/*
⭐ Central match data source
*/

const matches: Match[] = [
  {
    id: "1",
    slug: "india-vs-australia",

    currentOver: 0,
    currentBall: 0,

    team1: "India",
    team2: "Australia",

    status: "Live",

    // 🔴 REAL CRICKET API MATCH ID
    externalMatchId: "2aecce96-8565-4919-bc64-82a24d7d6908",

    score: "154/3",
    overs: "17.5",
    runRate: 8.8,
  },

  {
    id: "2",
    slug: "england-vs-pakistan",

    currentOver: 0,
    currentBall: 0,

    team1: "England",
    team2: "Pakistan",

    status: "Upcoming",
  },

  {
    id: "3",
    slug: "new-zealand-vs-south-africa",

    currentOver: 0,
    currentBall: 0,

    team1: "New Zealand",
    team2: "South Africa",

    status: "Completed",

    score: "240/8",
    overs: "50",
  },
];

// ✅ Get ALL matches
export async function getAllMatches(): Promise<Match[]> {
  return matches;
}

// ✅ Get SINGLE match by slug
export async function getMatchBySlug(
  slug: string
): Promise<Match | undefined> {
  return matches.find((match) => match.slug === slug);
}