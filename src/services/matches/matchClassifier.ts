import { CuratedMatch, MatchFormat, MatchStatus, ProviderMatch, ScoreEntry, Team } from "./types";

type Classification = {
  status: MatchStatus;
  liveConfidenceScore: number;
  isIPL: boolean;
  isICC: boolean;
  isInternational: boolean;
  isIndiaMatch: boolean;
  isFeatured: boolean;
  category: string;
  format: MatchFormat;
  statusText: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function toIsoDate(input: string): string {
  if (!input) return new Date(0).toISOString();
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return new Date(0).toISOString();
  return parsed.toISOString();
}

function normalizeTeams(match: ProviderMatch): Team[] {
  const teamInfo = Array.isArray(match.teamInfo) ? match.teamInfo : [];
  const teams = Array.isArray(match.teams) ? match.teams : [];

  const fromInfo = teamInfo
    .map((entry) => {
      const row = (typeof entry === "object" && entry !== null ? entry : {}) as {
        name?: unknown;
        shortname?: unknown;
      };
      const name = asString(row.name);
      if (!name) return null;
      const shortName = asString(row.shortname) || name.slice(0, 3).toUpperCase();
      return { name, shortName };
    })
    .filter((entry): entry is Team => Boolean(entry));

  if (fromInfo.length >= 2) return fromInfo.slice(0, 2);

  const fromNames = teams
    .map((name) => asString(name))
    .filter(Boolean)
    .map((name) => ({ name, shortName: name.slice(0, 3).toUpperCase() }));

  const merged = [...fromInfo, ...fromNames].slice(0, 2);

  while (merged.length < 2) {
    const fallback = merged.length === 0 ? "Team A" : "Team B";
    merged.push({ name: fallback, shortName: fallback.slice(0, 3).toUpperCase() });
  }

  return merged;
}

function normalizeScore(value: unknown): ScoreEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const row = entry as Record<string, unknown>;
      return {
        r: typeof row.r === "number" ? row.r : undefined,
        w: typeof row.w === "number" ? row.w : undefined,
        o: typeof row.o === "number" ? row.o : undefined,
        inning: asString(row.inning) || undefined,
      };
    })
    .filter((entry): entry is ScoreEntry => Boolean(entry));
}

function detectFormat(matchType: string, seriesName: string): MatchFormat {
  const source = `${matchType} ${seriesName}`.toLowerCase();
  if (source.includes("test")) return "TEST";
  if (source.includes("odi") || source.includes("one day")) return "ODI";
  return "T20";
}

function deriveSeriesName(name: string): string {
  const cleaned = name
    .replace(/\s*vs\s*.*/i, "")
    .replace(/\b\d+(st|nd|rd|th)?\s+match\b/gi, "")
    .replace(/[•|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Cricket Series";
}

function detectClassification(params: {
  statusText: string;
  started: boolean;
  ended: boolean;
  startTime: string;
  score: ScoreEntry[];
  seriesName: string;
  teams: Team[];
  matchType: string;
}): Classification {
  const statusTextLower = params.statusText.toLowerCase();
  const now = Date.now();
  const startAt = new Date(params.startTime).getTime();
  const hasOvers = params.score.some((entry) => typeof entry.o === "number" && entry.o > 0);

  let status: MatchStatus = "upcoming";
  let liveConfidenceScore = 0;

  if (
    params.ended ||
    /(won|loss|tied|draw|abandon|result|stumps)/i.test(statusTextLower)
  ) {
    status = "completed";
    liveConfidenceScore = 0;
  } else if (
    params.started ||
    hasOvers ||
    /(live|innings|need|required|trail|lead|target|day\s*[1-5]|break)/i.test(statusTextLower)
  ) {
    status = "live";
    liveConfidenceScore = params.started ? 95 : hasOvers ? 80 : 70;
  } else if (Number.isFinite(startAt) && startAt > now) {
    status = "upcoming";
    liveConfidenceScore = 0;
  } else if (params.started && !params.ended) {
    status = "live";
    liveConfidenceScore = 60;
  }

  const series = params.seriesName.toLowerCase();
  const teamText = params.teams.map((team) => team.name.toLowerCase()).join(" ");

  const isIPL = /\bipl\b|indian premier league/.test(series);
  const isICC = /\bicc\b|world cup|champions trophy|world test championship|u19/.test(series);
  const isInternational =
    /(test|odi|t20i)/i.test(params.matchType) ||
    /women\s+championship|world cup|asia cup|vs/.test(series);
  const isIndiaMatch = /\bindia\b|\bind\b/.test(series) || /\bindia\b/.test(teamText);

  const isFeatured = isIPL || isICC || isIndiaMatch || (isInternational && status !== "completed");
  const format = detectFormat(params.matchType, params.seriesName);

  const category = isIPL
    ? "IPL"
    : isICC
    ? "ICC"
    : isIndiaMatch
    ? "INDIA"
    : isInternational
    ? format
    : "DOMESTIC";

  return {
    status,
    liveConfidenceScore,
    isIPL,
    isICC,
    isInternational,
    isIndiaMatch,
    isFeatured,
    category,
    format,
    statusText: params.statusText || (status === "live" ? "Live" : status === "completed" ? "Completed" : "Upcoming"),
  };
}

function normalizeId(idValue: unknown, fallback: string): string {
  const id = asString(idValue);
  if (id) return id;
  return fallback
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `match-${Math.abs(fallback.length * 97)}`;
}

export function classifyProviderMatch(match: ProviderMatch, source: string): CuratedMatch {
  const name = asString(match.name) || "Cricket Match";
  const teams = normalizeTeams(match);
  const title = `${teams[0].name} vs ${teams[1].name}`;
  const shortTitle = `${teams[0].shortName} vs ${teams[1].shortName}`;

  const date = asString(match.date);
  const dateTimeGMT = asString(match.dateTimeGMT) || date;
  const startTime = toIsoDate(dateTimeGMT || date);
  const score = normalizeScore(match.score);
  const statusText = asString(match.status);
  const matchType = asString(match.matchType).toUpperCase() || "T20";
  const seriesName = deriveSeriesName(name);

  const classification = detectClassification({
    statusText,
    started: asBoolean(match.matchStarted),
    ended: asBoolean(match.matchEnded),
    startTime,
    score,
    seriesName,
    teams,
    matchType,
  });

  const id = normalizeId(match.id, `${title}-${startTime}`);

  return {
    id,
    title,
    shortTitle,
    teams,
    status: classification.status,
    format: classification.format,
    startTime,
    seriesName,
    isIPL: classification.isIPL,
    isICC: classification.isICC,
    isInternational: classification.isInternational,
    isIndiaMatch: classification.isIndiaMatch,
    isFeatured: classification.isFeatured,
    priorityScore: 0,
    liveConfidenceScore: classification.liveConfidenceScore,
    uiBadge: classification.category,
    source,

    name,
    matchType,
    matchCategory: classification.category,
    statusText: classification.statusText,
    venue: asString(match.venue) || undefined,
    date: date || undefined,
    dateTimeGMT: dateTimeGMT || undefined,
    teamInfo: teams.map((team) => ({ name: team.name, shortname: team.shortName })),
    score,
    isLive: classification.status === "live",
    isCompleted: classification.status === "completed",
    matchStarted: classification.status !== "upcoming",
    matchEnded: classification.status === "completed",
  };
}
