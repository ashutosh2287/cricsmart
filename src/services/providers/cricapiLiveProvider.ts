import { fetchLiveMatchEvents } from "@/services/api/cricketApiService";
import type { LiveProvider } from "@/services/providers/liveProvider";

export const cricApiLiveProvider: LiveProvider = {
  name: "cricapi",
  fetchEvents: (externalMatchId: string, signal?: AbortSignal) =>
    fetchLiveMatchEvents(externalMatchId, signal),
};

export function getLiveProvider(): LiveProvider {
  return cricApiLiveProvider;
}
