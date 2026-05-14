import type { FeaturePayload } from "@/services/ml/types";

export type FeatureSchemaContract = {
  version: string;
  featureNames: string[];
  normalizationRules: Record<string, string>;
  preprocessingVersion: string;
};

export const WIN_PROBABILITY_FEATURE_SCHEMA_VERSION = "win-probability.v1";

export const WIN_PROBABILITY_FEATURE_CONTRACT: FeatureSchemaContract = {
  version: WIN_PROBABILITY_FEATURE_SCHEMA_VERSION,
  featureNames: [
    "inningsIndex",
    "oversConfig",
    "over",
    "ball",
    "runs",
    "wickets",
    "ballsRemaining",
    "runRate",
    "requiredRate",
    "pressureMetric",
    "momentumMetric",
    "partnershipRuns",
    "battingStabilityMetric",
    "rawBattingProbability",
    "previousBattingProbability",
  ],
  normalizationRules: {
    inningsIndex: "identity",
    oversConfig: "identity",
    over: "identity",
    ball: "identity",
    runs: "minmax:0-400",
    wickets: "minmax:0-10",
    ballsRemaining: "minmax:0-300",
    runRate: "minmax:0-20",
    requiredRate: "minmax:0-25",
    pressureMetric: "minmax:0-100",
    momentumMetric: "minmax:-12-12",
    partnershipRuns: "minmax:0-250",
    battingStabilityMetric: "minmax:0-1",
    rawBattingProbability: "minmax:0-100",
    previousBattingProbability: "minmax:0-100",
  },
  preprocessingVersion: "wp-preprocess.v1",
};

const CONTRACTS: Record<string, FeatureSchemaContract> = {
  [WIN_PROBABILITY_FEATURE_SCHEMA_VERSION]: WIN_PROBABILITY_FEATURE_CONTRACT,
};

export function getFeatureContract(version: string): FeatureSchemaContract | null {
  return CONTRACTS[version] ?? null;
}

export function getActiveWinProbabilityFeatureContract(): FeatureSchemaContract {
  return WIN_PROBABILITY_FEATURE_CONTRACT;
}

export function toOrderedFeatureVector(payload: FeaturePayload, version: string): number[] {
  const contract = getFeatureContract(version);
  if (!contract) return [];
  return contract.featureNames.map((feature) => payload[feature] ?? 0);
}
