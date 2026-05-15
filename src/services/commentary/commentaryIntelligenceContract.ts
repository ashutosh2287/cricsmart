import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import type {
  CommentaryContext,
  CommentaryNarrativeState,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";

export type CommentaryGenerationPath = "template" | "template+enrich" | "retrieval+ai";
export type CommentaryEventImportance = "low" | "medium" | "high";
export type CommentaryRuntimeMode = "live" | "replay" | "simulation" | "mock";

export type CommentaryIntelligenceInput = {
  matchId: string;
  branchId: string;
  event: BallEvent;
  state: MatchState;
  events: BallEvent[];
  runtimeMode: CommentaryRuntimeMode;
  language?: "en" | "hi";
};

export type CommentaryGenerationStrategy = {
  importance: CommentaryEventImportance;
  path: CommentaryGenerationPath;
  reason: string;
};

export type CommentarySafety = {
  usedFallback: boolean;
  fallbackReason: string | null;
  blockedTerms: string[];
};

export type CommentaryFutureReadiness = {
  language: "en" | "hi";
  voice: {
    ttsReady: boolean;
    style: "neutral" | "excited" | "analytical";
  };
  analyst: {
    reasoning: string[];
    answerHints: string[];
  };
  highlightSignals: {
    turningPoint: boolean;
    wicketCluster: boolean;
    clutchMoment: boolean;
    momentumShift: boolean;
  };
};

export type CommentaryIntelligenceMetadata = {
  generator: "template" | "hybrid" | "retrieval" | "fallback";
  model: string;
  latencyMs: number;
  cacheHit: boolean;
  strategy: CommentaryGenerationStrategy;
  tone: CommentaryToneTag;
  categories: string[];
  tags: string[];
  narrativeState: string[];
  safety: CommentarySafety;
  runtimeMode: CommentaryRuntimeMode;
  createdAt: number;
  contextSummary: {
    pressureLevel: CommentaryContext["pressureLevel"];
    phaseOfMatch: CommentaryContext["phaseOfMatch"];
    momentumState: CommentaryContext["momentumState"];
    collapseRisk: number;
  };
  futureReadiness: CommentaryFutureReadiness;
};

export type CommentaryIntelligenceResult = {
  text: string;
  eventId: string;
  matchId: string;
  context: CommentaryContext;
  narrative: CommentaryNarrativeState;
  situation: CommentarySituationClassification;
  metadata: CommentaryIntelligenceMetadata;
};
