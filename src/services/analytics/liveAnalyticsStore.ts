type WinPoint = {
  over: number;
  value: number;
};

type MomentumPoint = {
  over: number;
  score: number;
};

type AnalyticsState = {
  winProbability: WinPoint[];
  momentum: MomentumPoint[];
};

const store: Record<string, AnalyticsState> = {};

export function getAnalytics(matchId: string): AnalyticsState {
  if (!store[matchId]) {
    store[matchId] = {
      winProbability: [],
      momentum: [],
    };
  }

  return store[matchId];
}

export function setAnalytics(
  matchId: string,
  data: AnalyticsState
) {
  store[matchId] = data;
}