export type MatchPhase = "powerplay" | "middle" | "death";

export type WinProbabilityFeatures = {
  currentScore: number;
  wicketsLost: number;
  oversCompleted: number;
  ballsRemaining: number;
  target: number;
  requiredRunRate: number;
  currentRunRate: number;
  recentRuns: number;
  recentWickets: number;
  phaseOfMatch: MatchPhase;
  innings: 1 | 2;
  battingFirst: 0 | 1;
  partnershipRuns: number;
};

export type NormalizedWinProbabilityFeatures = Omit<WinProbabilityFeatures, "phaseOfMatch"> & {
  phaseOfMatch: 0 | 1 | 2;
};

export type FeatureValidationError = {
  code:
    | "NAN_VALUE"
    | "MISSING_VALUE"
    | "INVALID_OVERS"
    | "INVALID_TARGET"
    | "INNINGS_MISMATCH";
  field: keyof WinProbabilityFeatures | "unknown";
  message: string;
};

export type FeatureValidationResult =
  | { ok: true; errors: [] }
  | { ok: false; errors: FeatureValidationError[] };
