import type { BallEvent } from "@/types/ballEvent";

export type DatasetIntegrityResult = {
  ok: boolean;
  chronologyValid: boolean;
  inningsValid: boolean;
  targetsValid: boolean;
  replayParityValid: boolean;
  leakageRisk: boolean;
  issues: string[];
};

export function splitMatchIdsForDataset(
  matchIds: string[],
  trainRatio = 0.8
): { trainMatchIds: string[]; testMatchIds: string[] } {
  const unique = [...new Set(matchIds)];
  const splitPoint = Math.max(1, Math.floor(unique.length * trainRatio));
  return {
    trainMatchIds: unique.slice(0, splitPoint),
    testMatchIds: unique.slice(splitPoint),
  };
}

export function detectFeatureLeakage(featureNames: string[]): string[] {
  const riskyTokens = ["result", "winner", "final", "future", "nextOver", "nextWicket"];
  return featureNames.filter((name) =>
    riskyTokens.some((token) => name.toLowerCase().includes(token.toLowerCase()))
  );
}

export function validateDatasetIntegrity(events: BallEvent[]): DatasetIntegrityResult {
  const issues: string[] = [];

  let chronologyValid = true;
  for (let i = 1; i < events.length; i++) {
    if ((events[i]?.timestamp ?? 0) < (events[i - 1]?.timestamp ?? 0)) {
      chronologyValid = false;
      issues.push("Event timestamps are not monotonically increasing");
      break;
    }
  }

  const inningsValid = events.every((event) => {
    if (event.innings === undefined) return true;
    return event.innings === 0 || event.innings === 1;
  });
  if (!inningsValid) {
    issues.push("Invalid innings value detected");
  }

  const targetsValid = events.every((event) => {
    if ((event.runs ?? 0) < 0) return false;
    return true;
  });
  if (!targetsValid) {
    issues.push("Invalid target-related values detected in event stream");
  }

  const replayParityValid = events.every((event) => Boolean(event.id && event.slug));
  if (!replayParityValid) {
    issues.push("Replay reconstruction key fields missing");
  }

  const observedFields = [...new Set(events.flatMap((event) => Object.keys(event)))];
  const leakageFeatures = detectFeatureLeakage(observedFields);
  const leakageRisk = leakageFeatures.length > 0;
  if (leakageRisk) {
    issues.push(`Potential leakage fields detected: ${leakageFeatures.join(", ")}`);
  }

  return {
    ok: chronologyValid && inningsValid && targetsValid && replayParityValid && !leakageRisk,
    chronologyValid,
    inningsValid,
    targetsValid,
    replayParityValid,
    leakageRisk,
    issues,
  };
}
