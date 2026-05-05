
import { fetchLiveMatchEvents, ApiBallEvent } from "../api/cricketApiService";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { smartReconcileMatch } from "../reconciliation/smartReconciler";
import { fetchWithRetry } from "../api/reliableFetch";
import { pushEvents, flushEvents } from "./eventBuffer";
import { isMatchActive } from "../match/matchManager";
import { redis } from "../queue/redisClient";
import { registerPlayer } from "../player/playerRegistry";

const pollingIntervals: Record<string, NodeJS.Timeout> = {};
const processedEvents: Record<string, Set<string>> = {};
const abortControllers: Record<string, AbortController> = {};
const lastProcessedPointer: Record<string, string> = {};

const POLL_INTERVAL = 4000;
const MAX_EVENT_CACHE = 300;

function buildEventKey(apiEvent: ApiBallEvent) {
  return `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}-${apiEvent.runs}-${apiEvent.type}-${apiEvent.wicket}`;
}

function buildPointer(apiEvent: ApiBallEvent) {
  return `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}`;
}

export function startLiveMatchIngestor(
  matchId: string,
  externalMatchId: string
) {
  if (pollingIntervals[matchId]) {
    console.warn(`⚠️ Ingestor already running for match: ${matchId}`);
    return;
  }

  console.log(`🚀 Starting live ingestion for match: ${matchId}`);

  processedEvents[matchId] = new Set();

  abortControllers[matchId]?.abort();
  abortControllers[matchId] = new AbortController();

  let pollCount = 0;
  let isReconciling = false;
  let isFetching = false;

  // 🔥 BACKOFF SYSTEM
let failureCount = 0;
let backoffUntil = 0;

  pollingIntervals[matchId] = setInterval(async () => {
  try {
    // 🔥 BACKOFF PROTECTION
if (Date.now() < backoffUntil) {
  console.log("⏳ In backoff window, skipping fetch...");
  return;
}
    pollCount++;
    if (!isMatchActive(matchId)) {
  console.log("🛑 Match not active, stopping ingestion");
  stopLiveMatchIngestor(matchId);
  return;
}

    // 🔒 prevent overlapping fetch
    if (isFetching) {
  console.log("⏳ Previous fetch still running, skipping...");
  return;
}

// 🛑 Pause ingestion during reconciliation
if (isReconciling) {
  console.log("⏸ Skipping ingestion during reconciliation");
  return;
}

isFetching = true;

      let state = getMatchState(matchId);
      if (!state) return;

      const innings = state.innings[state.currentInningsIndex];

      if (innings?.completed) {
        console.log("🛑 Match completed. Stopping ingestion.");
        stopLiveMatchIngestor(matchId);
        return;
      }

      let events: ApiBallEvent[] = [];

try {
  events = await fetchWithRetry(
    (signal) => fetchLiveMatchEvents(externalMatchId, signal),
    abortControllers[matchId].signal
  );

  // ✅ SUCCESS → RESET FAILURE COUNT
  failureCount = 0;

} catch (err) {
  failureCount++;

  console.error(`❌ Fetch failed (${failureCount})`, err);

  // 🔥 APPLY BACKOFF
  if (failureCount >= 3) {
    const delay = Math.min(15000, failureCount * 3000); // max 15s
    backoffUntil = Date.now() + delay;

    console.warn(`⚠️ Applying backoff for ${delay}ms`);
  }

  return;
}

     if (!Array.isArray(events) || events.length === 0) {
  return;
}

// 🔥 REGISTER PLAYERS (FROM EVENTS - FIRST TIME ONLY)
if (events.length > 0 && processedEvents[matchId].size === 0) {
  console.log("👥 Extracting players for full sync...");

  const playersSet = new Set<string>();

  events.forEach((e) => {
    if (e.batsman) playersSet.add(e.batsman);
    if (e.bowler) playersSet.add(e.bowler);
  });

  const players = Array.from(playersSet);

  // 🔥 register players
  players.forEach((p) => {
    registerPlayer(matchId, p, p);
  });

  // 🔥 sync batting order
  const { syncBattingOrder } = await import("../matchEngine");
  syncBattingOrder(matchId, players);
}

// ✅ push into buffer
pushEvents(matchId, events);

// ✅ flush combined batch
const bufferedEvents = flushEvents(matchId);

// 🔥 SAFETY LIMIT
if (bufferedEvents.length > 50) {
  console.warn("⚠️ Too many buffered events, trimming...");
  bufferedEvents.splice(50);
}

      // ✅ SORT EVENTS
      const sortedEvents = [...bufferedEvents].sort((a, b) => {
  if (a.innings !== b.innings) return a.innings - b.innings;
  if (a.over !== b.over) return a.over - b.over;
  return a.ball - b.ball;
});

      for (const apiEvent of sortedEvents) {
        const eventKey = buildEventKey(apiEvent);

        if (processedEvents[matchId].has(eventKey)) continue;

        // 🔁 ALWAYS GET LATEST STATE
        state = getMatchState(matchId);
        const currentInnings = state?.innings[state.currentInningsIndex];

        if (!currentInnings) continue;

        const striker = currentInnings.striker;
        const nonStriker = currentInnings.nonStriker;

        if (!striker || !nonStriker) {
          console.warn("⚠️ Missing batting pair — skipping event");
          continue;
        }

        const battingTeam = currentInnings.battingTeam ?? "";
        const bowlingTeam = currentInnings.bowlingTeam ?? "";

        const engineEvent = adaptApiEventToEngineEvent(
          matchId,
          apiEvent,
          striker,
          nonStriker,
          battingTeam,
          bowlingTeam
        );

        if (!engineEvent) continue;


// 🚀 PUSH TO REDIS QUEUE (instead of direct dispatch)
await redis.lpush(
  `match:${matchId}:events`,
  JSON.stringify(apiEvent)
);

// ✅ UPDATE POINTER (ONLY ONCE — USE HELPER)
lastProcessedPointer[matchId] = buildPointer(apiEvent);

// ✅ mark processed
processedEvents[matchId].add(eventKey);

// 🧠 Memory control
if (processedEvents[matchId].size > MAX_EVENT_CACHE) {
  const first = processedEvents[matchId].values().next().value;
  if (first) processedEvents[matchId].delete(first);
}
      }

      // ===============================
      // 🧠 SMART RECONCILIATION
      // ===============================
      try {
        if (pollCount % 3 === 0 && !isReconciling) {
          isReconciling = true;

          console.log("🧠 Running smart reconciliation...");

          await smartReconcileMatch(
            matchId,
            externalMatchId,
            lastProcessedPointer[matchId]
          );

          isReconciling = false;
        }
      } catch (err) {
        console.error("❌ Reconciliation failed:", err);
        isReconciling = false;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") return;
        console.error("❌ Live ingestion error:", err.message);
      } else {
        console.error("❌ Unknown ingestion error:", err);
      }
    }
    finally {
  isFetching = false;
}
  }, POLL_INTERVAL);
}

export function stopLiveMatchIngestor(matchId: string) {
  console.log(`🛑 Stopping ingestion for match: ${matchId}`);

  if (pollingIntervals[matchId]) {
    clearInterval(pollingIntervals[matchId]);
    delete pollingIntervals[matchId];
  }

  abortControllers[matchId]?.abort();
  delete abortControllers[matchId];

  delete processedEvents[matchId];
  delete lastProcessedPointer[matchId]; // ✅ cleanup
}