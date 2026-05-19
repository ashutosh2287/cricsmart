export type MatchFinishedEvent = {
  type: "MATCH_FINISHED";

  runtimeMatchId: string;

  winnerTeamId?: string;

  result: string;

  finalScore?: string;

  timestamp: number;
};
