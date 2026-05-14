import { EventSourceType } from "@/types/ballEvent";

export const COMMENTARY_TONE_TAGS = [
  "dramatic",
  "aggressive",
  "analytical",
  "celebratory",
  "tense",
  "calm",
] as const;

export const COMMENTARY_SITUATION_TAGS = [
  "wicket",
  "collapse",
  "partnership",
  "milestone",
  "chasePressure",
  "deathOvers",
  "powerplay",
  "recovery",
  "acceleration",
  "turningPoint",
  "clutchMoment",
  "momentumReversal",
] as const;

export type CommentaryToneTag = (typeof COMMENTARY_TONE_TAGS)[number];
export type CommentarySituationTag = (typeof COMMENTARY_SITUATION_TAGS)[number];

export type CommentaryPhase =
  | "powerplay"
  | "middleOvers"
  | "deathOvers"
  | "superOver"
  | "chaseClimax";

export type CommentaryPressureLevel = "low" | "medium" | "high" | "extreme";

export type CommentaryMomentumState =
  | "surging"
  | "stable"
  | "stalling"
  | "collapsing";

export type CommentaryContext = {
  matchId: string;
  branchId: string;
  eventId: string;
  source: EventSourceType | "MANUAL";
  innings: number;
  over: number;
  ball: number;
  phaseOfMatch: CommentaryPhase;

  currentScore: number;
  wickets: number;
  target: number | null;
  requiredRunRate: number;
  currentRunRate: number;
  partnershipRuns: number;
  recentBoundaries: number;

  pressureLevel: CommentaryPressureLevel;
  chaseDifficulty: number;
  clutchIndex: number;
  requiredAcceleration: number;

  momentumState: CommentaryMomentumState;
  momentumScore: number;
  recentRuns: number;
  recentWickets: number;
  scoringTrend: number;
  battingControl: number;

  partnershipStrength: number;
  rebuildStatus: "none" | "rebuilding" | "rebuilt";
  accelerationStatus: "none" | "building" | "accelerating";

  collapseRisk: number;
  wicketClusterRisk: number;
  battingFragility: number;

  batterForm: number;
  strikeRateTrend: number;
  boundaryPressure: number;
  bowlerDominance: number;
  matchupPressure: number;

  inningsNarrative: string;
  partnershipNarrative: string;
  chaseNarrative: string;
  momentumNarrative: string;
};

export type CommentarySituationClassification = {
  primary: CommentarySituationTag | null;
  tags: CommentarySituationTag[];
  confidence: number;
};

export type CommentaryNarrativeState = {
  matchId: string;
  branchId: string;
  eventId: string;
  activeNarratives: string[];
  history: string[];
};

export type CommentaryContextValidation = {
  valid: boolean;
  errors: string[];
};

export type CommentaryContextSnapshot = {
  matchId: string;
  branchId: string;
  eventId: string;
  sequence: number;
  timestamp: number;
  source: EventSourceType | "MANUAL";
  context: CommentaryContext;
  narrative: CommentaryNarrativeState;
  situation: CommentarySituationClassification;
  tone: CommentaryToneTag;
  validation: CommentaryContextValidation;
};
