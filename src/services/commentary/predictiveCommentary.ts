import { getNarrativeState } from "../narrative/narrativeEngine";
import { getDirectorMemory } from "../directorMemory";
import { CommentaryTone } from "./commentaryTypes";
import { emitCommentary } from "./commentaryBus";
import { DirectorState } from "../directorEngine";
import { commentaryPhrases } from "./commentaryPhrases";
import { getHighlights } from "../highlights/highlightStore";

/*
------------------------------------------------
DETERMINISTIC PHRASE PICKER
------------------------------------------------
*/

function pickPhrase(eventId: string, phrases: string[]) {

  if (!phrases.length) return "";

  let hash = 0;

  for (let i = 0; i < eventId.length; i++) {
    hash = (hash + eventId.charCodeAt(i)) % phrases.length;
  }

  return phrases[hash];
}

export function runPredictiveCommentary(
  matchId: string,
  branchId: string,
  directorState: DirectorState,
  upcomingEventId: string
) {

  const narrative = getNarrativeState(matchId, branchId);
  const memory = getDirectorMemory(matchId, branchId);

  if (!narrative) return;

  let text = "";
  let tone: CommentaryTone = "NEUTRAL";

/*
------------------------------------------------
TURNING POINT DETECTION
------------------------------------------------
*/

const highlights = getHighlights(matchId);

const lastHighlight = highlights[highlights.length - 1];

if (lastHighlight?.type === "TURNING_POINT") {

  text = "That could be the turning point of the match!";
  tone = "AGGRESSIVE";

}

  /*
  ------------------------------------------------
  HAT TRICK BUILDUP
  ------------------------------------------------
  */

  if (memory.wicketStreak === 2) {

    text = "Two wickets already — the hat-trick is on!";
    tone = "AGGRESSIVE";

  }

  /*
  ------------------------------------------------
  BOUNDARY ASSAULT
  ------------------------------------------------
  */

  else if (memory.boundaryStreak >= 2) {

    text = pickPhrase(
      upcomingEventId,
      commentaryPhrases.assault
    );

    tone = "AGGRESSIVE";
  }

  /*
  ------------------------------------------------
  CLIMAX ANTICIPATION
  ------------------------------------------------
  */

  else if (narrative.currentArc === "CLIMAX") {

    text = pickPhrase(
      upcomingEventId,
      commentaryPhrases.climax
    );

    tone = "AGGRESSIVE";
  }

  /*
  ------------------------------------------------
  COLLAPSE BUILDUP
  ------------------------------------------------
  */

  else if (memory.wicketStreak >= 2) {

    text = pickPhrase(
      upcomingEventId,
      commentaryPhrases.collapse
    );

    tone = "AGGRESSIVE";
  }

  /*
  ------------------------------------------------
  PRESSURE BUILD
  ------------------------------------------------
  */

  else if (
    narrative.currentArc === "PRESSURE_BUILD" &&
    memory.boundaryStreak === 0
  ) {

    text = pickPhrase(
      upcomingEventId,
      commentaryPhrases.pressure
    );

    tone = "CALM";
  }

  /*
  ------------------------------------------------
  DEATH OVER MOMENT
  ------------------------------------------------
  */

  else if (directorState.pacing === "CLIMAX") {

    text = pickPhrase(
      upcomingEventId,
      commentaryPhrases.climax
    );

    tone = "NEUTRAL";
  }
  if (directorState.pacing === "CLIMAX") {
  text = "This match is heading for a last-over thriller!";
  tone = "AGGRESSIVE";
}

  if (!text) return;

  emitCommentary({
    matchId,
    eventId: upcomingEventId,
    text,
    category: "INSIGHT"
  });

}