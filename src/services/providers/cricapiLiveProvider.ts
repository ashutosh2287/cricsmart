import type { ProviderMatch } from "@/services/matches/types";
import { fetchLiveMatchEvents } from "@/services/api/cricketApiService";
import { getProviderMode } from "@/config/providerMode";
import type {
  MatchProvider,
  ProviderMatchState,
  LiveProvider,
} from "@/services/providers/types";
import { mockMatchProvider } from "@/services/providers/mock/MockMatchProvider";
import { simulationMatchProvider } from "@/services/providers/simulationMatchProvider";

const API_BASE = "https://api.cricapi.com/v1";
const REQUEST_TIMEOUT_MS = 12_000;

async function fetchCurrentMatches(signal?: AbortSignal): Promise<ProviderMatch[]> {
  const apiKey = process.env.CRICKET_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${API_BASE}/currentMatches?offset=0&apikey=${encodeURIComponent(apiKey)}`,
      {
        cache: "no-store",
        signal: signal ?? controller.signal,
      }
    );

    if (!res.ok) return [];

    const payload = (await res.json()) as { data?: ProviderMatch[] };
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function getCricApiMatchState(
  externalMatchId: string,
  signal?: AbortSignal
): Promise<ProviderMatchState | null> {
  const events = await fetchLiveMatchEvents(externalMatchId, signal);
  const last = events[events.length - 1];
  if (!last) {
    return {
      externalMatchId,
      status: "upcoming",
      updatedAt: Date.now(),
    };
  }

  return {
    externalMatchId,
    status: "live",
    innings: last.innings,
    over: last.over,
    ball: last.ball,
    score: undefined,
    updatedAt: Date.now(),
  };
}

export const cricApiMatchProvider: MatchProvider = {
  name: "cricapi",
  mode: "cricketdata",
  supportsLivePolling: true,
  getFixtures: fetchCurrentMatches,
  getMatchState: getCricApiMatchState,
  pollMatchEvents: (externalMatchId: string, signal?: AbortSignal) =>
    fetchLiveMatchEvents(externalMatchId, signal),
};

export const cricApiLiveProvider: LiveProvider = {
  name: cricApiMatchProvider.name,
  fetchEvents: cricApiMatchProvider.pollMatchEvents,
};

export function getLiveProvider(): LiveProvider {
  const mode = getProviderMode();
  let provider = cricApiMatchProvider;

  if (mode === "mock") {
    provider = mockMatchProvider;
  } else if (mode === "simulation") {
    provider = simulationMatchProvider;
  }

  return {
    name: provider.name,
    fetchEvents: provider.pollMatchEvents,
  };
}
