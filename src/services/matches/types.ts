export type MatchStatus = "live" | "upcoming" | "completed";

export type MatchFormat = "T20" | "ODI" | "TEST";

export type Team = {
  name: string;
  shortName: string;
};

export type ScoreEntry = {
  r?: number;
  w?: number;
  o?: number;
  inning?: string;
};

export type ProviderTeamInfo = {
  name?: string;
  shortname?: string;
};

export type ProviderMatch = {
  id?: unknown;
  name?: unknown;
  matchType?: unknown;
  status?: unknown;
  venue?: unknown;
  date?: unknown;
  dateTimeGMT?: unknown;
  teams?: unknown;
  teamInfo?: unknown;
  score?: unknown;
  matchStarted?: unknown;
  matchEnded?: unknown;
};

export type CuratedMatch = {
  id: string;

  title: string;
  shortTitle: string;

  teams: Team[];

  status: MatchStatus;

  format: MatchFormat;

  startTime: string;

  seriesName: string;

  isIPL: boolean;
  isICC: boolean;
  isInternational: boolean;
  isIndiaMatch: boolean;
  isFeatured: boolean;

  priorityScore: number;

  liveConfidenceScore?: number;

  uiBadge?: string;

  source: string;

  // Backward-compatibility fields used by /matches/[id] and existing cards
  name: string;
  matchType: string;
  matchCategory: string;
  statusText: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teamInfo: { name: string; shortname: string }[];
  score: ScoreEntry[];
  isLive: boolean;
  isCompleted: boolean;
  matchStarted: boolean;
  matchEnded: boolean;
};

export type MatchSections = {
  live: CuratedMatch[];
  upcoming: CuratedMatch[];
  recent: CuratedMatch[];
  featured: CuratedMatch[];
};

export type CuratedDiscoveryPayload = {
  success: boolean;
  source: "live" | "cache" | "stale";
  stale?: boolean;
  updatedAt: string;
  data: CuratedMatch[];
  sections: MatchSections;
  error?: string;
};
