import type { BallEvent } from "@/types/ballEvent";
import type {
  CommentaryContext,
  CommentaryNarrativeState,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";
import { generateWithCommentaryLLM } from "./commentaryLLMProvider";

type EnrichmentInput = {
  baseText: string;
  retrievedText?: string | null;
  event: BallEvent;
  context: CommentaryContext;
  narrative: CommentaryNarrativeState;
  situation: CommentarySituationClassification;
  tone: CommentaryToneTag;
};

export async function enrichCommentaryNarrative(input: EnrichmentInput) {
  const narrativeHint = input.narrative.activeNarratives.slice(0, 2).join(", ");
  const retrieved = input.retrievedText ? `Retrieved context: ${input.retrievedText}.` : "";

  const prompt = [
    input.baseText,
    retrieved,
    `Tone: ${input.tone}.`,
    `Pressure: ${input.context.pressureLevel}.`,
    `Situation: ${input.situation.primary ?? "balanced"}.`,
    narrativeHint ? `Narrative continuity: ${narrativeHint}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const generated = await generateWithCommentaryLLM({
    prompt,
    temperature: 0.2,
  });

  return {
    text: generated.text,
    model: generated.model,
    provider: generated.provider,
  };
}
