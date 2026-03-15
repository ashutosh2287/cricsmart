import { fetchLiveMatchEvents } from "../api/cricketApiService";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { dispatchBallEvent } from "../matchEngine";

const pollingIntervals: Record<string, NodeJS.Timeout> = {};
const processedEvents: Record<string, Set<string>> = {};

export function startLiveMatchIngestor(
  matchId: string,
  externalMatchId: string
) {

  if (pollingIntervals[matchId]) return;

  if (!processedEvents[matchId]) {
    processedEvents[matchId] = new Set();
  }
  pollingIntervals[matchId] = setInterval(async () => {

    try {

      const events = await fetchLiveMatchEvents(externalMatchId);

      for (const apiEvent of events) {

        const eventKey = `${apiEvent.over}-${apiEvent.ball}`;

        if (processedEvents[matchId].has(eventKey)) continue;

        const engineEvent = adaptApiEventToEngineEvent(apiEvent);

        dispatchBallEvent(matchId, engineEvent);

        processedEvents[matchId].add(eventKey);
      }

    } catch (err) {
      console.error("Live ingestion error:", err);
    }

  }, 4000); // poll every 4 seconds
}

export function stopLiveMatchIngestor(matchId: string) {

  const interval = pollingIntervals[matchId];

  if (interval) {
    clearInterval(interval);
    delete pollingIntervals[matchId];
  }
}