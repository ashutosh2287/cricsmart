import { CuratedMatch } from "./types";

const SERIES_REPLACEMENTS: Array<[RegExp, string]> = [
  [/icc cricket world cup league 2\s*\d{4}[-–]\d{2,4}/gi, "ICC World Cup League 2"],
  [/indian premier league/gi, "IPL"],
  [/international cricket council/gi, "ICC"],
  [/\bmen'?s\b/gi, ""],
  [/\bwomen'?s\b/gi, "Women"],
];

function normalizeWhitespace(value: string): string {
  return value.replace(/[•|]/g, " ").replace(/\s{2,}/g, " ").trim();
}

function cleanSeriesName(seriesName: string): string {
  let cleaned = normalizeWhitespace(seriesName);
  for (const [pattern, replacement] of SERIES_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  cleaned = cleaned
    .replace(/\b\d+(st|nd|rd|th)?\s+match\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Cricket Series";
}

function compactTeamName(name: string): string {
  const cleaned = normalizeWhitespace(name);
  if (cleaned.length <= 18) return cleaned;
  return cleaned
    .replace(/\b(cricket|club|association|team|women|men)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function compactTitle(a: string, b: string): { title: string; shortTitle: string } {
  const left = compactTeamName(a) || "Team A";
  const right = compactTeamName(b) || "Team B";

  const shortLeft = left.length > 3 ? left.slice(0, 3).toUpperCase() : left.toUpperCase();
  const shortRight = right.length > 3 ? right.slice(0, 3).toUpperCase() : right.toUpperCase();

  return {
    title: `${left} vs ${right}`,
    shortTitle: `${shortLeft} vs ${shortRight}`,
  };
}

export function formatMatchForDisplay(match: CuratedMatch): CuratedMatch {
  const formattedTeams = match.teams.map((team) => {
    const cleanedName = compactTeamName(team.name) || team.name;
    return {
      name: cleanedName,
      shortName: team.shortName || cleanedName.slice(0, 3).toUpperCase(),
    };
  });

  const titles = compactTitle(formattedTeams[0]?.name ?? "Team A", formattedTeams[1]?.name ?? "Team B");
  const seriesName = cleanSeriesName(match.seriesName);

  return {
    ...match,
    teams: formattedTeams,
    teamInfo: formattedTeams.map((team) => ({ name: team.name, shortname: team.shortName })),
    title: titles.title,
    shortTitle: titles.shortTitle,
    seriesName,
    name: titles.title,
  };
}
