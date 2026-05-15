import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";

type RetrievalExample = {
  id: string;
  text: string;
  phase: CommentaryContext["overPhase"];
  minPressure: CommentaryContext["overPhase"];
  tag: "wicket" | "boundary" | "pressure" | "partnership" | "momentum";
};

const RETRIEVAL_EXAMPLES: RetrievalExample[] = [
  {
    id: "wicket_death",
    text: "Huge wicket at the death and the match narrative flips.",
    phase: "DEATH_OVERS",
    minPressure: "DEATH_OVERS",
    tag: "wicket",
  },
  {
    id: "boundary_release",
    text: "That boundary relieves sustained scoreboard pressure.",
    phase: "DEATH_OVERS",
    minPressure: "MIDDLE_OVERS",
    tag: "boundary",
  },
  {
    id: "partnership_rebuild",
    text: "The partnership is quietly rebuilding this innings.",
    phase: "MIDDLE_OVERS",
    minPressure: "POWERPLAY",
    tag: "partnership",
  },
  {
    id: "momentum_shift",
    text: "Momentum has shifted sharply after this passage.",
    phase: "MIDDLE_OVERS",
    minPressure: "POWERPLAY",
    tag: "momentum",
  },
];

function tagForPlan(plan: CommentaryPlan): RetrievalExample["tag"] {
  if (plan.templateKey.includes("wicket")) return "wicket";
  if (plan.templateKey.includes("boundary")) return "boundary";
  if (plan.templateKey.includes("partnership")) return "partnership";
  if (plan.templateKey.includes("momentum")) return "momentum";
  return "pressure";
}

export function retrieveCommentaryExamples(input: { context: CommentaryContext; plan: CommentaryPlan }) {
  const tag = tagForPlan(input.plan);
  const candidates = RETRIEVAL_EXAMPLES.filter((example) => example.tag === tag);
  return candidates.slice(0, 2).map((example) => ({
    id: example.id,
    text: example.text,
  }));
}

