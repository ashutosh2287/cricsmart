import { getMatchState, resetMatchState, dispatchBallEvent } from "../matchEngine";
import { fetchLiveMatchEvents } from "../api/cricketApiService";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";

export async function reconcileMatch(
  matchId: string,
  externalMatchId: string
) {
  const engineState = getMatchState(matchId);
  if (!engineState) return;

  const apiEvents = await fetchLiveMatchEvents(externalMatchId);
  if (!apiEvents || apiEvents.length === 0) return;

  // ✅ derive API score from last event
  const latestApiEvent = apiEvents[apiEvents.length - 1];

  const engineInnings =
    engineState.innings[engineState.currentInningsIndex];

  const engineRuns = engineInnings.runs;

  // 🔥 SIMPLE APPROXIMATION (can improve later)
  const apiRunsEstimate = apiEvents.reduce(
    (sum, e) => sum + (e.runs || 0),
    0
  );

  // ✅ STEP 1: detect mismatch
  if (engineRuns === apiRunsEstimate) return;

  console.warn("⚠️ Score mismatch detected → REPLAYING ENGINE");

  // ✅ STEP 2: FULL REPLAY (MOST STABLE)
  resetMatchState(matchId);

  for (const apiEvent of apiEvents) {
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