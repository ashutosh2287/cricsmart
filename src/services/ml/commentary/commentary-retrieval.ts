import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PressureBand = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
type WicketsLostBand = "0-2" | "3-5" | "6-8" | "9-10";
type OverBand = "0-5" | "6-15" | "16-20";

type RetrievalExample = {
  id: string;
  text: string;
  phase: CommentaryContext["overPhase"];
  pressureBand: PressureBand;
  wicketsLostBand: WicketsLostBand;
  overBand: OverBand;
  commentaryType: CommentaryPlan["commentaryType"];
  tag: "wicket" | "boundary" | "pressure" | "partnership" | "momentum";
};

export type RetrievalCandidate = {
  id: string;
  text: string;
  score: number;
};

export type RetrievalResult = {
  confidence: number;
  appliedFilters: {
    phase_of_match: string;
    pressure_level: string;
    wickets_lost_band: string;
    over_band: string;
    commentary_type: string;
  };
  candidates: RetrievalCandidate[];
  /** True when retrieval confidence meets the minimum threshold. */
  retrievalActive: boolean;
};

// ---------------------------------------------------------------------------
// Thresholds (Sprint C Step 12)
// ---------------------------------------------------------------------------

/** Minimum composite score for retrieval to be considered active. */
const MIN_RETRIEVAL_CONFIDENCE = 0.35;

// ---------------------------------------------------------------------------
// Static retrieval corpus
// ---------------------------------------------------------------------------

const RETRIEVAL_EXAMPLES: RetrievalExample[] = [
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

// ---------------------------------------------------------------------------
// Band helpers (deterministic, no randomness)
// ---------------------------------------------------------------------------

function tagForPlan(plan: CommentaryPlan): RetrievalExample["tag"] {
  if (plan.templateKey.includes("wicket")) return "wicket";
  if (plan.templateKey.includes("boundary")) return "boundary";
  if (plan.templateKey.includes("partnership")) return "partnership";
  if (plan.templateKey.includes("momentum")) return "momentum";
  return "pressure";
}

function pressureBandForContext(context: CommentaryContext): PressureBand {
  if (context.chaseComplexity >= 85) return "EXTREME";
  if (context.chaseComplexity >= 65) return "HIGH";
  if (context.chaseComplexity >= 35) return "MEDIUM";
  return "LOW";
}

function wicketsBand(wicketsLost: number): WicketsLostBand {
  if (wicketsLost <= 2) return "0-2";
  if (wicketsLost <= 5) return "3-5";
  if (wicketsLost <= 8) return "6-8";
  return "9-10";
}

function overBand(over: number): OverBand {
  if (over < 6) return "0-5";
  if (over < 16) return "6-15";
  return "16-20";
}

// ---------------------------------------------------------------------------
// Retrieval engine
// ---------------------------------------------------------------------------

/**
 * Retrieve commentary examples that contextually match the current ball event.
 *
 * Retrieval is purely assistive — the deterministic planner remains
 * authoritative.  When confidence is below MIN_RETRIEVAL_CONFIDENCE the
 * result has ``retrievalActive: false`` and the caller MUST fall back to
 * deterministic templates.
 *
 * The result ordering is fully deterministic: same inputs → same output.
 */
export function retrieveCommentaryExamples(input: {
  context: CommentaryContext;
  plan: CommentaryPlan;
}): RetrievalResult {
  const { context, plan } = input;
  const tag = tagForPlan(plan);
  const pressureBand = pressureBandForContext(context);
  const wicketsLostBand = wicketsBand(context.wickets);
  const currentOverBand = overBand(context.over);

  const scored = RETRIEVAL_EXAMPLES.map((example) => {
    let score = 0;
    if (example.tag === tag) score += 0.35;
    if (example.phase === context.overPhase) score += 0.2;
    if (example.pressureBand === pressureBand) score += 0.15;
    if (example.wicketsLostBand === wicketsLostBand) score += 0.15;
    if (example.overBand === currentOverBand) score += 0.1;
    if (example.commentaryType === plan.commentaryType) score += 0.05;
    return { example, score: Number(score.toFixed(4)) };
  })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      // Deterministic: descending score, then ascending id for tie-breaking.
      if (right.score !== left.score) return right.score - left.score;
      return left.example.id.localeCompare(right.example.id);
    });

  const selected = scored.slice(0, 3);
  const confidence = selected[0]?.score ?? 0;
  const retrievalActive = confidence >= MIN_RETRIEVAL_CONFIDENCE;

  return {
    confidence,
    retrievalActive,
    appliedFilters: {
      phase_of_match: context.overPhase,
      pressure_level: pressureBand,
      wickets_lost_band: wicketsLostBand,
      over_band: currentOverBand,
      commentary_type: plan.commentaryType,
    },
    candidates: selected.map((item) => ({
      id: item.example.id,
      text: item.example.text,
      score: item.score,
    })),
  };
}

