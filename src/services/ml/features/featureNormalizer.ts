import {
  FeatureValidationError,
  FeatureValidationResult,
  NormalizedWinProbabilityFeatures,
  WinProbabilityFeatures,
} from "./featureTypes";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function phaseToNumeric(phase: WinProbabilityFeatures["phaseOfMatch"]): 0 | 1 | 2 {
  if (phase === "powerplay") return 0;
  if (phase === "middle") return 1;
  return 2;
}

export function validateWinProbabilityFeatures(
  features: WinProbabilityFeatures
): FeatureValidationResult {
  const errors: FeatureValidationError[] = [];

  const numericFields: (keyof WinProbabilityFeatures)[] = [
    "currentScore",
    "wicketsLost",
    "oversCompleted",
    "ballsRemaining",
    "target",
    "requiredRunRate",
    "currentRunRate",
    "recentRuns",
    "recentWickets",
    "partnershipRuns",
  ];

  for (const field of numericFields) {
    const value = features[field];

    if (value === null || value === undefined) {
      errors.push({
        code: "MISSING_VALUE",
        field,
        message: `${field} is missing`,
      });
      continue;
    }

    if (!isFiniteNumber(value)) {
      errors.push({
        code: "NAN_VALUE",
        field,
        message: `${field} is not a finite number`,
      });
    }
  }

  if (features.oversCompleted < 0 || features.oversCompleted > 50) {
    errors.push({
      code: "INVALID_OVERS",
      field: "oversCompleted",
      message: "oversCompleted must be between 0 and 50",
    });
  }

  if (features.innings === 2 && features.target <= 0) {
    errors.push({
      code: "INVALID_TARGET",
      field: "target",
      message: "target must be positive for second innings",
    });
  }

  if (features.innings === 1 && features.target !== 0) {
    errors.push({
      code: "INNINGS_MISMATCH",
      field: "innings",
      message: "first innings target must be 0",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [] };
}

export function normalizeWinProbabilityFeatures(
  features: WinProbabilityFeatures
): NormalizedWinProbabilityFeatures {
  return {
    ...features,
    phaseOfMatch: phaseToNumeric(features.phaseOfMatch),
  };
}
