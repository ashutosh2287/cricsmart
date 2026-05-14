import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

export type InferenceMode = "LIVE" | "REPLAY" | "SIMULATION";

export type FeaturePayload = Record<string, number>;

export type InferenceEnvelope = {
  matchId: string;
  modelVersion: string;
  featureSchemaVersion: string;
  mode: InferenceMode;
  requestedAt: number;
};

export type WinProbabilityExtensionInput = {
  matchId: string;
  state: MatchState;
  ballEvent?: BallEvent;
  rawBattingProbability: number;
  previousBattingProbability?: number;
};

export type WinProbabilityExtensionOutput = {
  battingProbability: number;
  rawBattingProbability: number;
  modelVersion: string;
  featureSchemaVersion: string;
  fallbackUsed: boolean;
  latencyMs: number;
  retryCount: number;
  smoothing: {
    applied: boolean;
    previousWeight: number;
    currentWeight: number;
    criticalMoment: boolean;
  };
};
