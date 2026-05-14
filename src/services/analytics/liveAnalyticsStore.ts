type WinPoint = {
  over: number;
  value: number;
  confidence?: number;
  delta?: number;
  modelVersion?: string;
  timestamp?: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

type MomentumPoint = {
  over: number;
  score: number;
};

type AnalyticsState = {
  winProbability: WinPoint[];
  momentum: MomentumPoint[];
  prediction?: {
    currentProbability: number;
    previousProbability: number;
    probabilityDelta: number;
    confidence: number;
    modelVersion: string;
    predictionTimestamp: number;
    latencyMs: number;
    cacheHit: boolean;
    debounced: boolean;
  };
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
