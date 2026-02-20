import { Match } from "../types/match";
import { startRealtime } from "./realtimeService";

/*
⭐ Central match data source
*/

const matches: Match[] = [

  {
    id: "1",
    slug: "india-vs-australia",
    team1: "India",
    team2: "Australia",
    status: "Live",
    score: "154/3",
    overs: "17.5",
    runRate: 8.8
  },

  {
    id: "2",
    slug: "england-vs-pakistan",
    team1: "England",
    team2: "Pakistan",
    status: "Upcoming"
  },

  {
    id: "3",
    slug: "new-zealand-vs-south-africa",
    team1: "New Zealand",
    team2: "South Africa",
    status: "Completed",
    score: "240/8",
    overs: "50"
  }
];

// ✅ Get ALL matches
export async function getAllMatches(): Promise<Match[]> {

  startRealtime(matches);

  return matches;
}

// ✅ Get SINGLE match by slug
export async function getMatchBySlug(slug: string): Promise<Match | undefined> {

  return matches.find(match => match.slug === slug);
}