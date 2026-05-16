import crypto from "crypto";
import featureContract from "../../../../ml/commentary/models/feature_contract.json";
import runtimeThresholds from "../../../../ml/commentary/models/runtime_thresholds.json";
import type { CommentaryContext, CommentaryImportance, CommentaryTone, CommentaryType } from "@/services/commentary/types/commentary.types";

export type RuntimeFeatureContract = typeof featureContract;

export type RuntimeThresholds = {
  commentary_type_threshold: number;
  tone_threshold: number;
  importance_threshold: number;
  template_rank_threshold: number;
  retrieval_threshold: number;
  fallback_strategy?: string;
  description?: string;
};

export type RuntimeContractValidationResult = {
  valid: boolean;
  errors: string[];
  schemaVersion: string;
  schemaHash: string;
};

const CONTRACT = featureContract as RuntimeFeatureContract;

const REQUIRED_LABELS = {
  commentary_type: ["boundary", "collapse", "momentum", "partnership", "pressure", "summary", "turning_point", "wicket"],
  tone: ["analytical", "celebratory", "dramatic", "energetic", "neutral", "tense"],
  importance: ["high", "low", "medium"],
} as const;

function serializeStable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => serializeStable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${serializeStable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function computeContractHash(contract: RuntimeFeatureContract): string {
  const { schemaHash, ...rest } = contract;
  void schemaHash;
  return crypto.createHash("sha256").update(serializeStable(rest)).digest("hex");
}

function includesAll<T extends string>(actual: readonly string[] | undefined, required: readonly T[], key: string): string[] {
  if (!actual) return [`missing_label_mapping:${key}`];
  return required.filter((label) => !actual.includes(label)).map((label) => `missing_label:${key}:${label}`);
}

function validateSchema() {
  const errors: string[] = [];

  if (!CONTRACT.schemaVersion) errors.push("missing_schema_version");
  if (!CONTRACT.schemaHash) errors.push("missing_schema_hash");

  if (!Array.isArray(CONTRACT.classifierFeatures) || CONTRACT.classifierFeatures.length === 0) {
    errors.push("missing_classifier_features");
  }

  if (!Array.isArray(CONTRACT.rankerFeatures) || CONTRACT.rankerFeatures.length === 0) {
    errors.push("missing_ranker_features");
  }

  if (!Array.isArray(CONTRACT.targetColumns) || CONTRACT.targetColumns.length === 0) {
    errors.push("missing_target_columns");
  }

  const classifierDuplicates = CONTRACT.classifierFeatures.filter(
    (name, index) => CONTRACT.classifierFeatures.indexOf(name) !== index,
  );
  if (classifierDuplicates.length > 0) {
    errors.push(...classifierDuplicates.map((name) => `duplicate_classifier_feature:${name}`));
  }

  const rankerDuplicates = CONTRACT.rankerFeatures.filter(
    (name, index) => CONTRACT.rankerFeatures.indexOf(name) !== index,
  );
  if (rankerDuplicates.length > 0) {
    errors.push(...rankerDuplicates.map((name) => `duplicate_ranker_feature:${name}`));
  }

  const numericSet = new Set(CONTRACT.numericFeatures);
  const categoricalSet = new Set(CONTRACT.categoricalFeatures);
  for (const feature of CONTRACT.classifierFeatures) {
    if (!numericSet.has(feature) && !categoricalSet.has(feature)) {
      errors.push(`classifier_feature_not_declared:${feature}`);
    }
  }

  if (CONTRACT.schemaHash !== computeContractHash(CONTRACT)) {
    errors.push("schema_hash_mismatch");
  }

  errors.push(...includesAll(CONTRACT.labelMappings.commentary_type, REQUIRED_LABELS.commentary_type, "commentary_type"));
  errors.push(...includesAll(CONTRACT.labelMappings.tone, REQUIRED_LABELS.tone, "tone"));
  errors.push(...includesAll(CONTRACT.labelMappings.importance, REQUIRED_LABELS.importance, "importance"));

  return errors;
}

const CONTRACT_ERRORS = validateSchema();

export function getRuntimeFeatureContract(): RuntimeFeatureContract {
  return CONTRACT;
}

export function getRuntimeThresholds(): RuntimeThresholds {
  const typed = runtimeThresholds as Partial<RuntimeThresholds>;
  return {
    commentary_type_threshold: typed.commentary_type_threshold ?? 0.75,
    tone_threshold: typed.tone_threshold ?? 0.7,
    importance_threshold: typed.importance_threshold ?? 0.65,
    template_rank_threshold: typed.template_rank_threshold ?? 0.6,
    retrieval_threshold: typed.retrieval_threshold ?? 0.5,
    fallback_strategy: typed.fallback_strategy,
    description: typed.description,
  };
}

export function buildRuntimeFeatureMap(context: CommentaryContext): Record<string, string | number> {
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

export function getExpectedFeatureOrder(mode: "classifier" | "ranker") {
  return mode === "classifier" ? [...CONTRACT.classifierFeatures] : [...CONTRACT.rankerFeatures];
}

export function getRuntimeLabelMappings() {
  return CONTRACT.labelMappings as {
    commentary_type: string[];
    tone: string[];
    importance: string[];
  };
}

export function normalizeCommentaryTypeLabel(label: string): CommentaryType {
  if (label === "pressure") return "pressure-summary";
  if (label === "momentum") return "momentum-summary";
  if (label === "turning_point") return "turning-point";
  if (label === "summary") return "over-summary";
  return "ball";
}

export function normalizeToneLabel(label: string): CommentaryTone {
  if (label === "analytical" || label === "celebratory" || label === "dramatic" || label === "energetic" || label === "neutral" || label === "tense") {
    return label;
  }
  return "neutral";
}

export function normalizeImportanceLabel(label: string): CommentaryImportance {
  if (label === "high" || label === "medium" || label === "low") return label;
  return "medium";
}

export function validateRuntimeContract(): RuntimeContractValidationResult {
  return {
    valid: CONTRACT_ERRORS.length === 0,
    errors: [...CONTRACT_ERRORS],
    schemaVersion: CONTRACT.schemaVersion,
    schemaHash: CONTRACT.schemaHash,
  };
}