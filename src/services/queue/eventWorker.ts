
import { redis } from "./redisClient";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { ApiBallEvent } from "../api/cricketApiService";

const workers: Record<string, boolean> = {};
const workerLocks = new Set<string>();

// 🔥 WORKER SAFETY STATE
const processedPointers: Record<string, string> = {};
const processedKeys: Record<string, Set<string>> = {};
const MAX_CACHE = 200;

export function startWorker(matchId: string) {
  if (workerLocks.has(matchId)) {
  console.log(`⚠️ Worker already running for ${matchId}`);
  return;
}

workerLocks.add(matchId);

  workers[matchId] = true;
  processedKeys[matchId] = new Set();
  console.log(`🚀 Worker started for ${matchId}`);

  (async function loop() {
    while (workers[matchId]) {
      try {
        // block until an event arrives
        const res = await redis.brpop(`match:${matchId}:events`, 5);
        if (!res) continue;

        const [, payload] = res;
const apiEvent: ApiBallEvent = JSON.parse(payload);

// 🔥 BUILD UNIQUE KEY
const eventKey = `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}-${apiEvent.runs}-${apiEvent.type}`;

// 🔥 POINTER FOR ORDER
const pointer = `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}`;

// ✅ DEDUPE CHECK
if (processedKeys[matchId].has(eventKey)) {
  continue;
}

// ✅ ORDER PROTECTION
const lastPointer = processedPointers[matchId];

if (lastPointer && pointer <= lastPointer) {
  console.warn("⚠️ Out-of-order event skipped:", pointer);
  continue;
}

// ⬇️ EXISTING CODE CONTINUES
const state = getMatchState(matchId);

if (!state) {
  console.warn("⚠️ No match state, skipping event");
  continue;
}

const innings = state.innings[state.currentInningsIndex];

if (!innings?.striker || !innings?.nonStriker) {
  console.warn("⚠️ Missing batting pair, skipping event");
  continue;
}

        const engineEvent = adaptApiEventToEngineEvent(
           matchId,
          apiEvent,
          innings.striker,
          innings.nonStriker,
          innings.battingTeam || "",
          innings.bowlingTeam || ""
        );

        if (!engineEvent) continue;

        dispatchBallEvent(matchId, engineEvent);

        // ✅ mark processed
processedKeys[matchId].add(eventKey);
processedPointers[matchId] = pointer;

// 🧠 memory cleanup
if (processedKeys[matchId].size > MAX_CACHE) {
  const first = processedKeys[matchId].values().next().value;
  if (first) processedKeys[matchId].delete(first);
}
      } catch (err) {
        console.error("❌ Worker error:", err);
      }
    }

    console.log(`🛑 Worker stopped for ${matchId}`);
  })();
}

export function stopWorker(matchId: string) {
  workers[matchId] = false;
  workerLocks.delete(matchId);
}