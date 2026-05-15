import type { BallEvent } from "@/types/ballEvent";
import type {
  CommentaryContext,
  CommentaryNarrativeState,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";

type RetrievalCandidate = {
  id: string;
  text: string;
  tags: string[];
  phase: CommentaryContext["phaseOfMatch"];
  minPressure: CommentaryContext["pressureLevel"];
};

const CANDIDATES: RetrievalCandidate[] = [
  {
    id: "ret_wicket_chase",
    text: "Massive breakthrough under pressure, and the chase tilts again.",
    tags: ["wicket", "clutchMoment", "turningPoint"],
    phase: "chaseClimax",
    minPressure: "high",
  },
  {
    id: "ret_partnership_rebuild",
    text: "This stand is quietly rebuilding the innings after early damage.",
    tags: ["partnership", "recovery"],
    phase: "middleOvers",
    minPressure: "medium",
  },
  {
    id: "ret_death_boundary",
    text: "That boundary relieves a huge amount of scoreboard pressure.",
    tags: ["deathOvers", "chasePressure"],
    phase: "deathOvers",
    minPressure: "high",
  },
];

function pressureRank(level: CommentaryContext["pressureLevel"]) {
  switch (level) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
    case "extreme":
      return 4;
    default:
      return 1;
  }
}

export function retrieveSimilarCommentary(input: {
  event: BallEvent;
  context: CommentaryContext;
  situation: CommentarySituationClassification;
  narrative: CommentaryNarrativeState;
  tone: CommentaryToneTag;
}) {
  const { context, situation } = input;
  const currentPressure = pressureRank(context.pressureLevel);

  const ranked = CANDIDATES
    .map((candidate) => {
      let score = 0;
      if (candidate.phase === context.phaseOfMatch) score += 4;
      if (pressureRank(candidate.minPressure) <= currentPressure) score += 2;
      for (const tag of situation.tags) {
        if (candidate.tags.includes(tag)) score += 3;
      }
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.candidate.id.localeCompare(b.candidate.id)));

  const best = ranked[0];
  if (!best) {
    return {
      cacheHit: false,
      retrievalId: null,
      adaptedText: null,
      confidence: 0,
    };
  }

  return {
    cacheHit: true,
    retrievalId: best.candidate.id,
    adaptedText: `${best.candidate.text}`,
    confidence: Math.min(1, best.score / 10),
  };
}
