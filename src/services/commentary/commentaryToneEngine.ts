import type {
  CommentaryContext,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";

export function selectCommentaryTone(
  context: CommentaryContext,
  situation: CommentarySituationClassification,
): CommentaryToneTag {
  const tags = situation.tags;

  if (tags.includes("collapse") || tags.includes("turningPoint") || tags.includes("clutchMoment")) {
    return "dramatic";
  }

  if (tags.includes("wicket") || tags.includes("acceleration") || tags.includes("deathOvers")) {
    return "aggressive";
  }

  if (tags.includes("milestone") || context.momentumState === "surging") {
    return "celebratory";
  }

  if (context.pressureLevel === "high" || context.pressureLevel === "extreme") {
    return "tense";
  }

  if (context.phaseOfMatch === "middleOvers" || tags.includes("partnership") || tags.includes("recovery")) {
    return "analytical";
  }

  return "calm";
}
