import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";
import { getRuntimeThresholds } from "./commentary-runtime-contract";

type RetrievalExample = {
  id: string;
  text: string;
  phase: CommentaryContext["overPhase"];
  pressureBand: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  wicketsLostBand: "0-2" | "3-5" | "6-8" | "9-10";
  overBand: "0-5" | "6-15" | "16-20";
  commentaryType: CommentaryPlan["commentaryType"];
  tag: "wicket" | "boundary" | "pressure" | "partnership" | "momentum";
};

const RETRIEVAL_INDEX: RetrievalExample[] = [
  {
    id: "wicket_death",
    text: "Huge wicket at the death and the match narrative flips.",
    phase: "DEATH_OVERS",
    pressureBand: "HIGH",
    wicketsLostBand: "3-5",
    overBand: "16-20",
    commentaryType: "turning-point",
    tag: "wicket",
  },
  {
    id: "boundary_release",
    text: "That boundary relieves sustained scoreboard pressure.",
    phase: "DEATH_OVERS",
    pressureBand: "HIGH",
    wicketsLostBand: "3-5",
    overBand: "16-20",
    commentaryType: "pressure-summary",
    tag: "boundary",
  },
  {
    id: "partnership_rebuild",
    text: "The partnership is quietly rebuilding this innings.",
    phase: "MIDDLE_OVERS",
    pressureBand: "MEDIUM",
    wicketsLostBand: "3-5",
    overBand: "6-15",
    commentaryType: "momentum-summary",
    tag: "partnership",
  },
  {
    id: "momentum_shift",
    text: "Momentum has shifted sharply after this passage.",
    phase: "MIDDLE_OVERS",
    pressureBand: "MEDIUM",
    wicketsLostBand: "0-2",
    overBand: "6-15",
    commentaryType: "momentum-summary",
    tag: "momentum",
  },
];

export type CommentaryRetrievalResult = {
  confidence: number;
  candidates: Array<{ id: string; text: string; score: number }>;
  appliedFilters: {
    phase_of_match: CommentaryContext["overPhase"];
    pressure_level: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
    wickets_lost_band: "0-2" | "3-5" | "6-8" | "9-10";
    over_band: "0-5" | "6-15" | "16-20";
    commentary_type: CommentaryPlan["commentaryType"];
  };
  applied: boolean;
  fallbackReasons: string[];
  latencyMs: number;
};

function pressureBandForContext(context: CommentaryContext): RetrievalExample["pressureBand"] {
  if (context.chaseComplexity >= 85) return "EXTREME";
  if (context.chaseComplexity >= 65) return "HIGH";
  if (context.chaseComplexity >= 35) return "MEDIUM";
  return "LOW";
}

function wicketsBand(wicketsLost: number): RetrievalExample["wicketsLostBand"] {
  if (wicketsLost <= 2) return "0-2";
  if (wicketsLost <= 5) return "3-5";
  if (wicketsLost <= 8) return "6-8";
  return "9-10";
}

function overBand(over: number): RetrievalExample["overBand"] {
  if (over < 6) return "0-5";
  if (over < 16) return "6-15";
  return "16-20";
}

function tagForPlan(plan: CommentaryPlan): RetrievalExample["tag"] {
  if (plan.templateKey.includes("wicket")) return "wicket";
  if (plan.templateKey.includes("boundary")) return "boundary";
  if (plan.templateKey.includes("partnership")) return "partnership";
  if (plan.templateKey.includes("momentum")) return "momentum";
  return "pressure";
}

export function runCommentaryRetrieval(input: {
  context: CommentaryContext;
  plan: CommentaryPlan;
  timeoutMs?: number;
}): CommentaryRetrievalResult {
  const startedAt = Date.now();
  const thresholds = getRuntimeThresholds();
  const fallbackReasons: string[] = [];

  if (RETRIEVAL_INDEX.length === 0) {
    return {
      confidence: 0,
      candidates: [],
      appliedFilters: {
        phase_of_match: input.context.overPhase,
        pressure_level: pressureBandForContext(input.context),
        wickets_lost_band: wicketsBand(input.context.wickets),
        over_band: overBand(input.context.over),
        commentary_type: input.plan.commentaryType,
      },
      applied: false,
      fallbackReasons: ["retrieval_index_load_failed"],
      latencyMs: Date.now() - startedAt,
    };
  }

  const phase = input.context.overPhase;
  const pressure = pressureBandForContext(input.context);
  const wickets = wicketsBand(input.context.wickets);
  const over = overBand(input.context.over);
  const tag = tagForPlan(input.plan);

  const filtered = RETRIEVAL_INDEX.filter((example) => example.phase === phase || example.tag === tag);

  const scored = filtered
    .map((example) => {
      let score = 0;
      if (example.tag === tag) score += 0.35;
      if (example.phase === phase) score += 0.2;
      if (example.pressureBand === pressure) score += 0.15;
      if (example.wicketsLostBand === wickets) score += 0.15;
      if (example.overBand === over) score += 0.1;
      if (example.commentaryType === input.plan.commentaryType) score += 0.05;
      return { example, score: Number(score.toFixed(4)) };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.example.id.localeCompare(right.example.id);
    });

  const deduped = Array.from(new Map(scored.map((item) => [item.example.id, item])).values());
  const candidates = deduped.slice(0, 3).map((item) => ({
    id: item.example.id,
    text: item.example.text,
    score: item.score,
  }));

  const confidence = candidates[0]?.score ?? 0;
  const timedOut = input.timeoutMs != null && Date.now() - startedAt > input.timeoutMs;
  const weakSimilarity = confidence < thresholds.retrieval_threshold;

  if (timedOut) fallbackReasons.push("retrieval_timeout");
  if (weakSimilarity) fallbackReasons.push("retrieval_confidence_below_threshold");

  return {
    confidence,
    candidates: timedOut || weakSimilarity ? [] : candidates,
    appliedFilters: {
      phase_of_match: phase,
      pressure_level: pressure,
      wickets_lost_band: wickets,
      over_band: over,
      commentary_type: input.plan.commentaryType,
    },
    applied: !timedOut && !weakSimilarity,
    fallbackReasons,
    latencyMs: Date.now() - startedAt,
  };
}
