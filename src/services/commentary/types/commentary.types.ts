import type { BallEvent } from "@/types/ballEvent";

export type PressureLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type MomentumState = "BATTING" | "BOWLING" | "NEUTRAL";

export type CommentaryTone =
  | "neutral"
  | "dramatic"
  | "energetic"
  | "analytical"
  | "tense"
  | "celebratory";

export type CommentaryImportance = "low" | "medium" | "high";

export type CollapseRisk = "LOW" | "MEDIUM" | "HIGH";

export type OverPhase = "POWERPLAY" | "MIDDLE_OVERS" | "DEATH_OVERS";

export type CommentaryType =
  | "ball"
  | "over-summary"
  | "pressure-summary"
  | "momentum-summary"
  | "turning-point";

export type PlayerNarrative = {
  player: string;
  summary: string;
  recentRuns: number;
  ballsFaced: number;
  boundaries: number;
  wickets: number;
};

export interface NarrativeState {
  momentumTeam: string | null;
  pressureLevel: PressureLevel;
  collapseRisk: CollapseRisk;
  currentPartnershipRuns: number;
  recentBoundaryCount: number;
  dotBallPressure: number;
  battingControl: number;
  chaseComplexity: number;
  turningPointDetected: boolean;
  lastWicketOver: number | null;
  wicketsInCluster: number;
  recentRuns: number;
  recentWickets: number;
  overPhase: OverPhase;
  batterNarratives: Record<string, PlayerNarrative>;
  bowlerNarratives: Record<string, PlayerNarrative>;
}

export interface CommentaryContext {
  matchId: string;
  branchId: string;
  eventId: string;
  innings: number;
  over: number;
  ball: number;
  battingTeam: string;
  bowlingTeam: string;
  batter: string;
  nonStriker: string;
  bowler: string;
  dismissedPlayer?: string;
  eventType: BallEvent["type"];
  runsThisBall: number;
  battingScore: number;
  wickets: number;
  target: number | null;
  ballsRemaining: number;
  wicketsRemaining: number;
  requiredRunRate: number;
  currentRunRate: number;
  dotBallStreak: number;
  recentRuns: number;
  recentWickets: number;
  recentBoundaryCount: number;
  currentPartnershipRuns: number;
  currentPartnershipBalls: number;
  wicketsInCluster: number;
  recentOverRuns: number;
  wicketsInOver: number;
  scoringAcceleration: number;
  overPhase: OverPhase;
  battingControl: number;
  chaseComplexity: number;
  probabilitySwing: number;
  isOverComplete: boolean;
}

export interface CommentaryPlan {
  commentaryType: CommentaryType;
  narrativeType: string;
  tone: CommentaryTone;
  importance: CommentaryImportance;
  focusPlayer?: string;
  momentumShift: boolean;
  pressureContext: PressureLevel;
  templateKey: string;
}

export interface CommentaryEvent {
  type: "commentary.generated";
  matchId: string;
  eventId: string;
  commentaryType: CommentaryType;
  narrativeType: string;
  text: string;
  tone: CommentaryTone;
  importance: CommentaryImportance;
  over: number;
  ball: number;
  innings: number;
  timestamp: number;
  focusPlayer?: string;
  templateKey?: string;
}

export type CommentaryProbabilityState = {
  previousWinProbability?: number | null;
  currentWinProbability?: number | null;
};
