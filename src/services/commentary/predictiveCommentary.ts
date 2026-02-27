import { getNarrativeState } from "../narrative/narrativeEngine";
import { getDirectorMemory } from "../directorMemory";
import { CommentaryTone } from "./commentaryTypes";
import { emitCommentary } from "./commentaryBus";
import { DirectorState } from "../directorEngine";

export function runPredictiveCommentary(
  matchId: string,
  branchId: string,
  directorState: DirectorState,
  upcomingEventId: string
) {
  const narrative = getNarrativeState(matchId, branchId);
  const memory = getDirectorMemory();

  if (!narrative) return;

  let text = "";
  let tone: CommentaryTone = "NEUTRAL";

  // ----------------------------
  // CLIMAX ANTICIPATION
  // ----------------------------

  if (narrative.currentArc === "CLIMAX") {
    text = "Something big is brewing here...";
    tone = "AGGRESSIVE";
  }

  // ----------------------------
  // COLLAPSE BUILDUP
  // ----------------------------

  else if (
    narrative.currentArc === "PRESSURE_BUILD" &&
    memory.boundaryStreak === 0
  ) {
    text = "The pressure is mounting. A mistake feels imminent.";
    tone = "CALM";
  }

  // ----------------------------
  // DEATH OVER ANTICIPATION
  // ----------------------------

  else if (directorState.pacing === "CLIMAX") {
    text = "This could be a defining moment in the match.";
    tone = "NEUTRAL";
  }

  if (!text) return;

  emitCommentary({
    matchId,
    branchId,
    eventId: upcomingEventId,
    text,
    tone
  });
}