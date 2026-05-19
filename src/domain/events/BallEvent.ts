export type BallEvent = {
  type: "BALL";

  runtimeMatchId: string;

  innings: number;

  over: number;
  ball: number;

  battingTeamId?: string;
  bowlingTeamId?: string;

  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;

  runs: number;
  extras: number;

  totalScore: number;
  wickets: number;

  isBoundary: boolean;
  isWicket: boolean;

  timestamp: number;
};
