import { fetchLiveMatchEvents } from "../api/cricketApiService";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { dispatchBallEvent, getMatchState } from "../matchEngine";

const pollingIntervals: Record<string, NodeJS.Timeout> = {};
const processedEvents: Record<string, Set<string>> = {};
const abortControllers: Record<string, AbortController> = {};

const POLL_INTERVAL = 4000;
const MAX_EVENT_CACHE = 300;

export function startLiveMatchIngestor(
  matchId: string,
  externalMatchId: string
) {
  if (pollingIntervals[matchId]) {
    console.warn(`⚠️ Ingestor already running for match: ${matchId}`);
    return;
  }

  console.log(`🚀 Starting live ingestion for match: ${matchId}`);

  if (!processedEvents[matchId]) {
    processedEvents[matchId] = new Set();
  }

  if (abortControllers[matchId]) {
    abortControllers[matchId].abort();
  }
  abortControllers[matchId] = new AbortController();

  pollingIntervals[matchId] = setInterval(async () => {
    try {
      const state = getMatchState(matchId);

      if (
        !state ||
        state.innings[state.currentInningsIndex]?.completed
      ) {
        console.log("🛑 Match completed. Stopping ingestion.");
        stopLiveMatchIngestor(matchId);
        return;
      }

      const currentInnings = state.innings[state.currentInningsIndex];

      // 🧠 GET REAL STRIKER / NON-STRIKER
      

      const events = await fetchLiveMatchEvents(
        externalMatchId,
        abortControllers[matchId].signal
      );

      if (!events || !Array.isArray(events)) {
        console.warn("⚠️ No events received or invalid format");
        return;
      }
    for (const apiEvent of events) {
  const eventKey = apiEvent?.id;

  if (!eventKey) continue;
  if (processedEvents[matchId].has(eventKey)) continue;

  const engineEvent = adaptApiEventToEngineEvent(
    apiEvent,
    matchId,
    "" // ✅ TEMP FIX (no non-striker in system)
  );

  if (!engineEvent) continue;

  dispatchBallEvent(matchId, engineEvent);

  processedEvents[matchId].add(eventKey);

  if (processedEvents[matchId].size > MAX_EVENT_CACHE) {
    const first = processedEvents[matchId]
      .values()
      .next().value;

    if (first) {
      processedEvents[matchId].delete(first);
    }
  }
}
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          console.log("⛔ Fetch aborted (expected)");
          return;
        }

        console.error("❌ Live ingestion error:", err.message);
      } else {
        console.error("❌ Unknown ingestion error:", err);
      }
    }
  }, POLL_INTERVAL);
}

export function stopLiveMatchIngestor(matchId: string) {
  console.log(`🛑 Stopping ingestion for match: ${matchId}`);

  const interval = pollingIntervals[matchId];

  if (interval) {
    clearInterval(interval);
    delete pollingIntervals[matchId];
  }

  if (abortControllers[matchId]) {
    abortControllers[matchId].abort();
    delete abortControllers[matchId];
  }

  delete processedEvents[matchId];
}