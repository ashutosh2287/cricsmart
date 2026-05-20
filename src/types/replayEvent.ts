export type ReplayEvent = {
  id: string;
  sequenceNumber: number;
  type: string;
  timestamp: number;
  inning: number;
  over: number;
  ball: number;
  payload: unknown;
};
