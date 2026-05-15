import type { CommentaryContext, CommentaryNarrativeState, CommentarySituationClassification } from "./commentaryContextTypes";

type StoryEntry = {
  eventId: string;
  timestamp: number;
  storyBeat: string;
};

type StoryState = {
  activeStoryline: string;
  history: StoryEntry[];
};

const storyStore: Record<string, StoryState> = {};

function deriveStoryline(context: CommentaryContext, narrative: CommentaryNarrativeState, situation: CommentarySituationClassification) {
  if (situation.tags.includes("collapse")) return "batting-collapse-pressure";
  if (situation.tags.includes("partnership")) return "partnership-rebuild";
  if (situation.tags.includes("turningPoint")) return "turning-point-swing";
  if (context.phaseOfMatch === "chaseClimax") return "clutch-finish";
  if (narrative.activeNarratives.includes("batting acceleration")) return "late-innings-acceleration";
  return "balanced-contest";
}

export function updateMatchStory(input: {
  matchId: string;
  eventId: string;
  timestamp: number;
  context: CommentaryContext;
  narrative: CommentaryNarrativeState;
  situation: CommentarySituationClassification;
}) {
  const current = storyStore[input.matchId] ?? { activeStoryline: "balanced-contest", history: [] };
  const nextStory = deriveStoryline(input.context, input.narrative, input.situation);

  if (current.activeStoryline !== nextStory) {
    current.history.push({
      eventId: input.eventId,
      timestamp: input.timestamp,
      storyBeat: nextStory,
    });
  }

  current.activeStoryline = nextStory;
  storyStore[input.matchId] = current;
  return current;
}

export function getMatchStoryState(matchId: string) {
  return storyStore[matchId] ?? null;
}
