import { getEventStream, getMatchState } from "../matchEngine";
import { calculateRunRate } from "./metrics/runRate";
import { calculateMomentum } from "./metrics/momentum";

export type AnalyticsResult = {
  runRate: number[];
  momentum: number[];
};

export function computeAnalytics(matchId: string): AnalyticsResult {

  const events = getEventStream(matchId);
  const state = getMatchState(matchId);

  if (!state) {
    return { runRate: [], momentum: [] };
  }

  // filter active branch
  const filtered = events.filter(e =>
    e.valid && (!e.branchId || e.branchId === state.activeBranchId)
  );

  return {
    runRate: calculateRunRate(filtered),
    momentum: calculateMomentum(filtered)
  };
}