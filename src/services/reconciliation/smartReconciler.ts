import {
  getMatchState,
  dispatchBallEvent,
} from "../matchEngine";
import { fetchLiveMatchEvents, ApiBallEvent } from "../api/cricketApiService";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";

// 🔧 helper
function buildPointer(e: ApiBallEvent) {
  return `${e.innings}-${e.over}-${e.ball}`;
}

// ✅ MAX DRIFT CONFIG
const MAX_DRIFT = 12; // balls

export async function smartReconcileMatch(
  matchId: string,
  externalMatchId: string,
  lastPointer?: string
) {
  const engineState = getMatchState(matchId);
  if (!engineState) return;

  const apiEvents = await fetchLiveMatchEvents(externalMatchId);
  if (!apiEvents.length) return;

  // 🔥 LOCAL DEDUPE FOR REPLAY
  const replayed = new Set<string>();

  // ============================
  // STEP 1: FIND LAST POINTER
  // ============================
  let startIndex = 0;

  if (lastPointer) {
    const idx = apiEvents.findIndex((e) => {
      const ptr = buildPointer(e);
      return ptr === lastPointer;
    });

    // 🔥 fallback match
    if (idx === -1 && lastPointer) {
      const [, lastOver, lastBall] = lastPointer.split("-");

      const fallbackIdx = apiEvents.findIndex(
        (e) =>
          String(e.over) === lastOver &&
          String(e.ball) === lastBall
      );

      if (fallbackIdx !== -1) {
        console.warn("⚠️ Pointer fallback match used");
        startIndex = fallbackIdx + 1;
      }
    }

    if (idx !== -1) {
      startIndex = idx + 1;
    }
  }

  // ============================
  // STEP 2: DRIFT CHECK
  // ============================
  const drift = apiEvents.length - startIndex;

  if (drift > MAX_DRIFT) {
    console.warn("⚠️ Large drift → full replay");

    const { resetMatchState } = await import("../matchEngine");
    const { stopWorker, startWorker } = await import("../queue/eventWorker");

    // 🔥 STOP WORKER
    stopWorker(matchId);

    // 🔥 RESET ENGINE
    resetMatchState(matchId);

    for (const apiEvent of apiEvents) {
      const pointer = buildPointer(apiEvent);

      // 🔁 dedupe replay
      if (replayed.has(pointer)) continue;
      replayed.add(pointer);

      const state = getMatchState(matchId);
      const innings = state?.innings[state.currentInningsIndex];

      if (!innings?.striker || !innings?.nonStriker) continue;

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
    }

    // 🔥 RESTART WORKER
    startWorker(matchId);

    return;
  }

  // ============================
  // STEP 3: NO NEW EVENTS
  // ============================
  if (startIndex >= apiEvents.length) return;

  console.log(
    `🧠 Partial replay from index ${startIndex} / ${apiEvents.length}`
  );

  // ============================
  // STEP 4: PARTIAL REPLAY
  // ============================
  for (let i = startIndex; i < apiEvents.length; i++) {
    const apiEvent = apiEvents[i];

    const pointer = buildPointer(apiEvent);

    // 🔁 dedupe replay
    if (replayed.has(pointer)) continue;
    replayed.add(pointer);

    const state = getMatchState(matchId);
    const innings = state?.innings[state.currentInningsIndex];

    if (!innings?.striker || !innings?.nonStriker) continue;

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
  }
}