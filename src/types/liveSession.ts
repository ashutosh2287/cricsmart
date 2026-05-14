export type LiveSessionProvider = "cricapi";

export type LiveSessionState =
  | "INITIALIZING"
  | "ACTIVE"
  | "STALE"
  | "DISCONNECTED"
  | "COMPLETED"
  | "FAILED";

export type LiveMatchInitPayload = {
  externalMatchId: string;
  provider: LiveSessionProvider;
  teamA: string;
  teamB: string;
  seriesName?: string;
  format?: "T20" | "ODI" | "TEST";
  scheduledStart?: string;
};

export type LiveMatchInitResponse = {
  success: boolean;
  matchId: string;
  slug: string;
  sessionState: Extract<LiveSessionState, "INITIALIZING" | "ACTIVE">;
  message?: string;
};
