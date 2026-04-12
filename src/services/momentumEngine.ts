import { subscribeCommand, Command } from "./commandBus";
import { getHighlights } from "@/services/highlights/highlightStore";

let momentum = 0;

const listeners = new Set<(value: number) => void>();

export function subscribeMomentum(cb: (value: number) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emitMomentum() {
  listeners.forEach((l) => l(momentum));
}

/*
================================================
🔥 MOMENTUM LOGIC (UPGRADED)
================================================
*/

function handleCommand(command: Command) {

  const matchId = command.slug;

  switch (command.type) {

    case "RUN_SCORED":
      momentum += 0.5;
      break;

    case "BOUNDARY_FOUR":
      momentum += 2;
      break;

    case "BOUNDARY_SIX":
      momentum += 3;
      break;

    case "WICKET_FALL":
      momentum -= 5; // ✅ CORRECT (negative)
      break;

    case "DOT_BALL":
      momentum -= 1;
      break;
  }

  /*
  🔥 HIGHLIGHT BOOST (OPTIONAL)
  */

  if (matchId) {
    const highlights = getHighlights(matchId);
    const last = highlights[highlights.length - 1];

    if (last?.type === "TURNING_POINT") {
      momentum += 6;
    }
  }

  /*
  🔻 DECAY (SMOOTH)
  */

  momentum *= 0.9;

  momentum = Math.max(-100, Math.min(100, momentum));

  emitMomentum();
}

/*
================================================
INIT MOMENTUM ENGINE
================================================
*/

export function initMomentumEngine() {
  subscribeCommand(handleCommand);
}