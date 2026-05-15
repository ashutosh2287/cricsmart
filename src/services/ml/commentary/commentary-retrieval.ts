import {
  predictCommentaryContext,
  type CommentaryContextPrediction,
  type CommentaryMlContext,
  type RuntimeCommentaryType,
  type RuntimeMomentumState,
  type RuntimePhaseOfMatch,
  type RuntimePressureLevel,
} from "./commentary-predictor";

export type CommentaryRetrievalExample = {
  id: string;
  text: string;
  commentaryType: RuntimeCommentaryType;
  tone: CommentaryContextPrediction["tone"];
  importance: CommentaryContextPrediction["importance"];
  pressureLevel: RuntimePressureLevel;
  momentumState: RuntimeMomentumState;
  phaseOfMatch: RuntimePhaseOfMatch;
  probabilitySwing: number;
  tags?: string[];
};

export type RetrievedCommentaryExample = CommentaryRetrievalExample & {
  score: number;
};

const DEFAULT_EXAMPLES: CommentaryRetrievalExample[] = [
  {
    id: "death-wicket-shift",
    text: "Massive breakthrough at the death, and the pressure instantly shifts back to the chasing side.",
    commentaryType: "turning_point",
    tone: "dramatic",
    importance: "high",
    pressureLevel: "EXTREME",
    momentumState: "BOWLING",
    phaseOfMatch: "DEATH_OVERS",
    probabilitySwing: 72,
    tags: ["wicket", "death", "pressure"],
  },
  {
    id: "partnership-rebuild",
    text: "This partnership is soaking up the pressure and quietly rebuilding the innings.",
    commentaryType: "partnership",
    tone: "analytical",
    importance: "medium",
    pressureLevel: "MEDIUM",
    momentumState: "BATTING",
    phaseOfMatch: "MIDDLE_OVERS",
    probabilitySwing: 28,
    tags: ["partnership", "recovery"],
  },
  {
    id: "boundary-release",
    text: "That boundary releases some of the pressure and gives the batters a moment of breathing room.",
    commentaryType: "boundary",
    tone: "energetic",
    importance: "medium",
    pressureLevel: "HIGH",
    momentumState: "BATTING",
    phaseOfMatch: "DEATH_OVERS",
    probabilitySwing: 36,
    tags: ["boundary", "pressure"],
  },
];

function scoreExample(
  example: CommentaryRetrievalExample,
  prediction: CommentaryContextPrediction,
  context: CommentaryMlContext
): number {
  let score = 0;
  if (example.commentaryType === prediction.commentaryType) score += 4;
  if (example.tone === prediction.tone) score += 2;
  if (example.importance === prediction.importance) score += 1.5;
  if (example.pressureLevel === prediction.pressureLevel) score += 2.5;
  if (example.momentumState === prediction.momentumState) score += 2;
  if (example.phaseOfMatch === (context.phaseOfMatch ?? (context.over < 6 ? "POWERPLAY" : context.over >= 16 ? "DEATH_OVERS" : "MIDDLE_OVERS"))) {
    score += 2.5;
  }
  score += Math.max(0, 2 - Math.abs(example.probabilitySwing - prediction.scores.probabilitySwing) / 20);
  return Number(score.toFixed(4));
}

export function retrieveSimilarCommentary(options: {
  context: CommentaryMlContext;
  prediction?: CommentaryContextPrediction;
  examples?: CommentaryRetrievalExample[];
  limit?: number;
}): RetrievedCommentaryExample[] {
  const prediction = options.prediction ?? predictCommentaryContext(options.context);
  const examples = options.examples ?? DEFAULT_EXAMPLES;
  const limit = options.limit ?? 3;

  return examples
    .map((example) => ({ ...example, score: scoreExample(example, prediction, options.context) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
