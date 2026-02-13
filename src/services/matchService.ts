import { Match } from "../types/match";
import { startRealtime } from "./realtimeService";


/*
  ⭐ Central match data source
  Later this can be replaced with:
  - Database
  - External cricket API
  - Realtime backend
*/

const matches: Match[] = [
  {
    slug: "india-vs-australia",
    team1: "India",
    team2: "Australia",
    status: "Live",
    score: "154/3",
    overs: "17.5",
    runRate: "8.80"
  },

  {
    slug: "england-vs-pakistan",
    team1: "England",
    team2: "Pakistan",
    status: "Upcoming"
  },

  {
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
  startRealtime(matches);   // start realtime when backend loads
  return matches;
}


// ✅ Get SINGLE match by slug (for dynamic page)
export async function getMatchBySlug(slug: string): Promise<Match | undefined> {
  return matches.find(match => match.slug === slug);
}
