import { Match } from "../types/match";

export async function fetchMatches(): Promise<Match[]> {

  const res = await fetch("/api/matches");

  if (!res.ok) {
    throw new Error("Failed to fetch matches");
  }

  const data = await res.json();

  return data.matches;
}


export async function fetchMatchBySlug(slug: string): Promise<Match> {

  const res = await fetch(`/api/matches/${slug}`);

  if (!res.ok) {
    throw new Error("Match not found");
  }

  const data = await res.json();

  return data.match;
}
