import type { ApiBallEvent } from "@/services/api/cricketApiService";
import type { ProviderMatch } from "@/services/matches/types";
import type { ProviderMode } from "@/config/providerMode";

export type ProviderMatchState = {
  externalMatchId: string;
  status: "live" | "upcoming" | "completed";
  innings?: number;
  over?: number;
  ball?: number;
  score?: string;
  updatedAt: number;
};

export type MatchProvider = {
  name: string;
  mode: ProviderMode;
  supportsLivePolling: boolean;
  getFixtures: (signal?: AbortSignal) => Promise<ProviderMatch[]>;
  getMatchState: (
    externalMatchId: string,
    signal?: AbortSignal
  ) => Promise<ProviderMatchState | null>;
  pollMatchEvents: (
    externalMatchId: string,
    signal?: AbortSignal
  ) => Promise<ApiBallEvent[]>;
};

// Backward-compatible subset used in existing ingest/reconcile code.
export type LiveProvider = {
  name: string;
  fetchEvents: (
    externalMatchId: string,
    signal?: AbortSignal
  ) => Promise<ApiBallEvent[]>;
};
