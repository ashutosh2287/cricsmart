import type { BallEvent } from "@/types/ballEvent";
import type {
  CommentaryContext,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";
import { generateAdvancedCommentary } from "@/services/commentary/advancedCommentaryEngine";
import type { MatchState } from "@/services/matchEngine";

function pressurePhrase(context: CommentaryContext) {
  if (context.pressureLevel === "extreme") return "with the match on a knife edge";
  if (context.pressureLevel === "high") return "relieving sustained pressure";
  if (context.pressureLevel === "medium") return "keeping the chase balanced";
  return "without much risk";
}

function tonePrefix(tone: CommentaryToneTag) {
  switch (tone) {
    case "dramatic":
      return "Huge moment";
    case "aggressive":
      return "Power play";
    case "analytical":
      return "Tactical update";
    case "tense":
      return "Tension rising";
    case "celebratory":
      return "Crowd on its feet";
    default:
      return "Steady progress";
  }
}

function milestoneHint(situation: CommentarySituationClassification) {
  if (situation.tags.includes("milestone")) return "A key milestone is reached.";
  if (situation.tags.includes("turningPoint")) return "This may be the turning point.";
  if (situation.tags.includes("collapse")) return "Wickets are starting to cluster.";
  if (situation.tags.includes("partnership")) return "The stand is gathering value.";
  return "";
}

export function generateTemplateCommentary(input: {
  event: BallEvent;
  state: MatchState;
  context: CommentaryContext;
  situation: CommentarySituationClassification;
  tone: CommentaryToneTag;
}) {
  const { event, state, context, situation, tone } = input;

  const prefix = tonePrefix(tone);
  const pressure = pressurePhrase(context);
  const hint = milestoneHint(situation);

  if (event.type === "WD") {
    return `${prefix}: wide called, an extra conceded ${pressure}. ${hint}`.trim();
  }

  if (event.type === "NB") {
    return `${prefix}: no-ball from ${event.bowler}, gifting momentum ${pressure}. ${hint}`.trim();
  }

  if (event.type === "RUN") {
    if (event.runs === 0) {
      return `${prefix}: dot ball from ${event.bowler}, pressure keeps building. ${hint}`.trim();
    }

    if (event.runs === 1) {
      return `${event.batsman} nudges a single, ${pressure}. ${hint}`.trim();
    }

    if (event.runs === 2) {
      return `${event.batsman} works hard for two, ${pressure}. ${hint}`.trim();
    }

    if (event.runs === 3) {
      return `${event.batsman} races back for three, ${pressure}. ${hint}`.trim();
    }
  }

  if (event.type === "FOUR") {
    return `${event.batsman} relieves the pressure with a crisp boundary through the infield. ${hint}`.trim();
  }

  if (event.type === "SIX") {
    return `${event.batsman} launches this into the crowd ${pressure}. ${hint}`.trim();
  }

  if (event.type === "WICKET") {
    return `${prefix}: wicket! ${event.dismissedBatsman ?? event.batsman} departs and the pressure spikes. ${hint}`.trim();
  }

  const advanced = generateAdvancedCommentary(event, state);
  return advanced || "No significant update on that delivery.";
}
