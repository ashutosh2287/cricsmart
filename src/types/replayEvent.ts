export type ReplayEvent = {
  id: string;
  sequenceNumber: number;
  type: string;
  timestamp: number;
  inning: number;
  innings?: number;
  over: number;
  ball: number;
  runs?: number;
  totalRuns?: number;
  isLegalDelivery?: boolean;
  homeWinPct?: number;
  awayWinPct?: number;
  payload: unknown;
};
