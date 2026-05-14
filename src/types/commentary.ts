import type { BallEvent, EventSourceType } from "@/types/ballEvent";

export type CommentaryMode = "LIVE" | "MOCK" | "SIMULATION" | "REPLAY";

export type CommentaryToneType =
  | "dramatic"
  | "aggressive"
  | "analytical"
  | "tense"
  | "celebratory"
  | "calm";

export type CommentaryEventCategory =
  | "delivery"
  | "boundary"
  | "wicket"
  | "milestone"
  | "partnership"
  | "collapse"
  | "pressure"
  | "momentum_swing"
  | "summary"
  | "insight";

export type CommentaryTag =
  | "aggressive"
  | "dramatic"
  | "analytical"
  | "celebratory"
  | "tense"
  | "collapse"
  | "milestone"
  | "partnership"
  | "chase_pressure";

export type CommentaryContextSignals = {
  pressureIndex: number;
  pressureState: "low" | "moderate" | "high";
  momentumScore: number;
  momentumState: "surge" | "stall" | "collapse" | "neutral";
  partnershipRuns: number;
  chaseDifficulty: "none" | "manageable" | "hard" | "extreme";
  recentBoundaries: number;
  collapseRisk: "none" | "watch" | "high";
  batterForm: "cold" | "set" | "hot";
  bowlerDominance: "low" | "medium" | "high";
  narrativeState: string;
  situationSignals: CommentaryEventCategory[];
};

export type CommentaryInputSchema = {
  matchId: string;
  branchId: string;
  mode: CommentaryMode;
  event: BallEvent;
  source: EventSourceType;
  innings: number;
  over: number;
  ball: number;
  context: CommentaryContextSignals;
};

export type CommentaryMetadata = {
  generator: "template" | "hybrid" | "fallback";
  model: string;
  latencyMs: number;
  cacheHit: boolean;
  usedFallback: boolean;
  tone: CommentaryToneType;
  categories: CommentaryEventCategory[];
  tags: CommentaryTag[];
  createdAt: number;
};

export type CommentaryGenerationResult = {
  text: string;
  metadata: CommentaryMetadata;
  input: CommentaryInputSchema;
};
