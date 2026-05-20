export type MatchMetadataTeam = {
  id: string;
  name: string;
};

export type MatchMetadata = {
  matchId: string;
  runtimeMatchId?: string;
  title?: string;
  venue?: string;
  homeTeam?: MatchMetadataTeam;
  awayTeam?: MatchMetadataTeam;
  teamA?: MatchMetadataTeam;
  teamB?: MatchMetadataTeam;
  tossWinner?: string;
  tossDecision?: "BAT" | "BOWL";
  toss?: {
    winner: string;
    decision: "BAT" | "BOWL";
  };
};
