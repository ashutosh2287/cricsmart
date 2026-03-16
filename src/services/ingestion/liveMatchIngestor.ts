import { fetchLiveMatchEvents } from "../api/cricketApiService"
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter"
import { dispatchBallEvent, getMatchState } from "../matchEngine"

const pollingIntervals: Record<string, NodeJS.Timeout> = {}
const processedEvents: Record<string, Set<string>> = {}

const POLL_INTERVAL = 4000
const MAX_EVENT_CACHE = 300

export function startLiveMatchIngestor(
  matchId: string,
  externalMatchId: string
) {

  if (pollingIntervals[matchId]) return

  if (!processedEvents[matchId]) {
    processedEvents[matchId] = new Set()
  }

  pollingIntervals[matchId] = setInterval(async () => {

    try {

      const state = getMatchState(matchId)

      if (state?.innings[state.currentInningsIndex]?.completed) {
        stopLiveMatchIngestor(matchId)
        return
      }

      const events = await fetchLiveMatchEvents(externalMatchId)
      console.log("Fetched events:", events);

      for (const apiEvent of events) {

        const eventKey = apiEvent.id

        if (processedEvents[matchId].has(eventKey)) continue

        const engineEvent = adaptApiEventToEngineEvent(
          apiEvent,
          matchId,
          ""
        )

        dispatchBallEvent(matchId, engineEvent)

        processedEvents[matchId].add(eventKey)

        if (processedEvents[matchId].size > MAX_EVENT_CACHE) {

          const first = processedEvents[matchId]
            .values()
            .next().value

          if (first !== undefined) {
            processedEvents[matchId].delete(first)
          }

        }

      }

    } catch (err) {

      console.error("Live ingestion error:", err)

    }

  }, POLL_INTERVAL)

}

export function stopLiveMatchIngestor(matchId: string) {

  const interval = pollingIntervals[matchId]

  if (interval) {
    clearInterval(interval)
    delete pollingIntervals[matchId]
  }

}