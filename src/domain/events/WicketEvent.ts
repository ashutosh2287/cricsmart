export type WicketEvent = {
  type: "WICKET";

  runtimeMatchId: string;

  innings: number;

  over: number;
  ball: number;

  wicketType: string;

  batterOutId?: string;
  bowlerId?: string;

  totalScore: number;
  wickets: number;

  timestamp: number;
};
