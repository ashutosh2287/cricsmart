import crypto from "crypto";
import featureContract from "../../../../ml/commentary/models/feature_contract.json";
import runtimeThresholds from "../../../../ml/commentary/models/runtime_thresholds.json";
import type { CommentaryContext } from "@/services/commentary/types/commentary.types";

export type RuntimeFeatureValidationResult = {
  valid: boolean;
  errors: string[];
  orderedFeatures: number[];
  featureMap: Record<string, string | number>;
  schemaHash: string;
  schemaVersion: string;
};

type FeatureSpec = {
  name: string;
  type: "int" | "float" | "categorical";
  categories?: string[];
};

type FeatureContract = {
  schemaVersion: string;
  schemaHash: string;
  features: FeatureSpec[];
};

const CONTRACT = featureContract as FeatureContract;

function serializeStable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => serializeStable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${serializeStable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function computedSchemaHashStable(contract: FeatureContract): string {
  const { schemaHash: _ignored, ...rest } = contract;
  return crypto.createHash("sha256").update(serializeStable(rest)).digest("hex");
}

function mapContextToFeatureMap(context: CommentaryContext): Record<string, string | number> {
  return {
    innings: context.innings,
    over: context.over,
    ball: context.ball,
    runs: context.runsThisBall,
    wicket: context.eventType === "WICKET" ? 1 : 0,
    extras: 0,
    current_score: context.battingScore,
    wickets_lost: context.wickets,
    required_rr: context.requiredRunRate,
    current_rr: context.currentRunRate,
    target: context.target ?? 0,
    balls_remaining: context.ballsRemaining,
    recent_runs: context.recentRuns,
    recent_wickets: context.recentWickets,
    dot_ball_streak: context.dotBallStreak,
    partnership_runs: context.currentPartnershipRuns,
    partnership_balls: context.currentPartnershipBalls,
    phase_of_match: context.overPhase,
    win_probability: 50,
    pressure_score: context.chaseComplexity,
    momentum_score: context.scoringAcceleration * 10,
    collapse_score: context.wicketsInCluster * 10,
    partnership_strength: context.currentPartnershipRuns,
    boundary_frequency: context.recentBoundaryCount * 10,
    dot_ball_pressure: context.dotBallStreak * 10,
    probability_swing: context.probabilitySwing,
    death_over_intensity: context.overPhase === "DEATH_OVERS" ? Math.max(0, (context.over - 15) * 12) : 0,
  };
}

export function validateRuntimeFeatureContract(context: CommentaryContext): RuntimeFeatureValidationResult {
  const featureMap = mapContextToFeatureMap(context);
  const errors: string[] = [];

  const stableHash = computedSchemaHashStable(CONTRACT);
  if (CONTRACT.schemaHash !== stableHash) {
    errors.push("schema_hash_mismatch");
  }

  const orderedFeatures = CONTRACT.features.map((feature) => {
    const value = featureMap[feature.name];
    if (value === undefined || value === null) {
      errors.push(`missing_feature:${feature.name}`);
      return 0;
    }

    if (feature.type === "categorical") {
      const normalized = String(value);
      if (feature.categories && !feature.categories.includes(normalized)) {
        errors.push(`invalid_category:${feature.name}:${normalized}`);
      }
      return 0;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      errors.push(`nan_feature:${feature.name}`);
      return 0;
    }
    if (feature.type === "int" && !Number.isInteger(numeric)) {
      errors.push(`invalid_int_feature:${feature.name}`);
    }
    return numeric;
  });

  return {
    valid: errors.length === 0,
    errors,
    orderedFeatures,
    featureMap,
    schemaHash: CONTRACT.schemaHash,
    schemaVersion: CONTRACT.schemaVersion,
  };
}

export function getRuntimeThresholds() {
  return runtimeThresholds as {
    commentary_type_threshold: number;
    tone_threshold: number;
    template_threshold: number;
    retrieval_threshold?: number;
  };
}
