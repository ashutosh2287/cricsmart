type AnalyticsState = {
  runs: number;
  balls: number;
  runRateHistory: number[];
  momentumHistory: number[];
};

const analyticsCache: Record<string, AnalyticsState> = {};

export function getAnalyticsState(matchId: string) {
  return analyticsCache[matchId];
}

export function initAnalytics(matchId: string) {

  analyticsCache[matchId] = {
    runs: 0,
    balls: 0,
    runRateHistory: [],
    momentumHistory: []
  };
}

export function setAnalyticsState(matchId: string, state: AnalyticsState) {
  analyticsCache[matchId] = state;
}