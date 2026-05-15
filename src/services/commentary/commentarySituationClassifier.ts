import type {
  CommentaryContext,
  CommentarySituationClassification,
  CommentarySituationTag,
} from "./commentaryContextTypes";

function confidenceFromTags(tags: CommentarySituationTag[], context: CommentaryContext): number {
  const base = tags.length ? 0.45 : 0.1;
  const pressureBoost = context.pressureLevel === "extreme" ? 0.3 : context.pressureLevel === "high" ? 0.2 : 0;
  const clutchBoost = context.phaseOfMatch === "chaseClimax" ? 0.15 : 0;
  return Math.min(1, base + pressureBoost + clutchBoost);
}

function pickPrimary(tags: CommentarySituationTag[]): CommentarySituationTag | null {
  const priority: CommentarySituationTag[] = [
    "clutchMoment",
    "turningPoint",
    "collapse",
    "wicket",
    "momentumReversal",
    "deathOvers",
    "chasePressure",
    "partnership",
    "milestone",
    "powerplay",
    "acceleration",
    "recovery",
  ];

  for (const item of priority) {
    if (tags.includes(item)) return item;
  }

  return null;
}

export function classifyCommentarySituation(context: CommentaryContext): CommentarySituationClassification {
  const tags = new Set<CommentarySituationTag>();

  if (context.recentWickets > 0) tags.add("wicket");
  if (context.collapseRisk >= 0.6) tags.add("collapse");
  if (context.partnershipRuns >= 35) tags.add("partnership");
  if (context.phaseOfMatch === "chaseClimax" || context.clutchIndex >= 70) tags.add("clutchMoment");
  if (context.phaseOfMatch === "deathOvers") tags.add("deathOvers");
  if (context.phaseOfMatch === "powerplay") tags.add("powerplay");
  if (context.requiredAcceleration >= 2.5 || context.pressureLevel === "high" || context.pressureLevel === "extreme") {
    tags.add("chasePressure");
  }
  if (context.accelerationStatus === "accelerating") tags.add("acceleration");
  if (context.rebuildStatus === "rebuilding" || context.rebuildStatus === "rebuilt") tags.add("recovery");
  if (context.momentumState === "collapsing" || context.scoringTrend <= -2.5) tags.add("momentumReversal");

  const currentCheckpoint = Math.floor(context.currentScore / 50);
  const previousCheckpoint = Math.floor((context.currentScore - Math.max(context.recentRuns, 0)) / 50);
  if (currentCheckpoint > previousCheckpoint) tags.add("milestone");

  if (
    (tags.has("collapse") && tags.has("clutchMoment")) ||
    (tags.has("momentumReversal") && tags.has("chasePressure"))
  ) {
    tags.add("turningPoint");
  }

  const normalizedTags = [...tags];
  return {
    primary: pickPrimary(normalizedTags),
    tags: normalizedTags,
    confidence: confidenceFromTags(normalizedTags, context),
  };
}
