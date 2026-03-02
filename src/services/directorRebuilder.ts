import { getEventStream, getMatchState } from "./matchEngine";
import { processAnalyticsEvent } from  "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";
import { resetDirectorState } from "./directorEngine";

/*
================================================
DIRECTOR REBUILD
================================================
*/

export function rebuildDirector(matchId: string) {

  const events = getEventStream(matchId);
  const matchState = getMatchState(matchId);

  if (!matchState) return;

  const activeBranch = matchState.activeBranchId;

resetDirectorState(matchState.matchId, activeBranch);

  for (const event of events) {

    if (!event.valid) continue;
    if (event.branchId && event.branchId !== activeBranch) continue;

    // Re-run analytics (without emitting)
    processAnalyticsEvent(matchId, event);

    // Re-run highlight (without emitting)
    processHighlightEvent(matchId, event);

    // Signals will update director state
    // but because emit=false in rebuild mode, no animations fire
  }
}