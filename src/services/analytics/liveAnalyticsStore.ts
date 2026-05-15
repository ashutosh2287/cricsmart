type WinPoint = {
  over: number;
  value: number;
  confidence?: number;
  delta?: number;
  modelVersion?: string;
  timestamp?: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

type ProbabilityTimelinePoint = {
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  probability: number;
  timestamp: number;
};

type MomentumPoint = {
  over: number;
  score: number;
};

type AnalyticsState = {
  winProbability: WinPoint[];
  momentum: MomentumPoint[];
  currentWinProbability?: number;
  previousWinProbability?: number;
  probabilityDelta?: number;
  probabilityTimeline?: ProbabilityTimelinePoint[];
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
      currentWinProbability: 50,
      previousWinProbability: 50,
      probabilityDelta: 0,
      probabilityTimeline: [],
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
