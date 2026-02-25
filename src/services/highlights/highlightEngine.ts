// highlightEngine.ts

import { BallEvent } from "@/types/ballEvent";
import { addHighlight } from "./highlightStore";
import { emitDirectorSignal } from "../directorSignalBus";

export function processHighlightEvent(
  matchId: string,
  event: BallEvent
) {

  if (!event.valid) return;

  // 🎯 Wicket highlight
  if (event.wicket) {

  const highlightId = crypto.randomUUID();

  addHighlight(matchId, {
    id: highlightId,
    type: "WICKET",
    event
  });

  // 🔥 Emit director signal
  emitDirectorSignal({
    type: "HIGHLIGHT_DETECTED",
    subtype: "WICKET",
    eventId: event.id
  });
}

  // 🎯 Six highlight
  if (event.type === "SIX") {

  const highlightId = crypto.randomUUID();

  addHighlight(matchId, {
    id: highlightId,
    type: "SIX",
    event
  });

  // 🔥 Emit director signal
  emitDirectorSignal({
    type: "HIGHLIGHT_DETECTED",
    subtype: "SIX",
    eventId: event.id
  });
}
}