export type WinProbabilityFeatures = {
  innings: number;
  over: number;
  ball: number;
  currentScore: number;
  wicketsLost: number;
  oversCompleted: number;
  ballsRemaining: number;
  targetValue: number;
  requiredRunRate: number;
  currentRunRate: number;
  recentRuns: number;
  recentWickets: number;
  phaseOfMatch: number;
  battingFirst: number;
  partnershipRuns: number;
};

export type PredictionSource = "LIVE" | "SIMULATION" | "MOCK" | "REPLAY";

export type PredictionMetadata = {
  modelVersion: string;
  source: PredictionSource;
  timestamp: number;
  latencyMs: number;
  predictionCount: number;
  smoothing: {
    applied: boolean;
    previousWeight: number;
    currentWeight: number;
  };
};

export type WinProbabilityPrediction = {
  probability: number;
  previousProbability: number | null;
  probabilityDelta: number;
  confidence: number;
  rawProbability: number;
  features: WinProbabilityFeatures;
  metadata: PredictionMetadata;
};

export type ProbabilityHistoryPoint = {
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  probability: number;
  timestamp: number;
};

