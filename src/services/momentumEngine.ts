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
      momentum += 1;
      break;

    case "BOUNDARY_FOUR":
      momentum += 3;
      break;

    case "BOUNDARY_SIX":
      momentum += 5;
      break;

    case "WICKET_FALL":
      momentum += 8;
      break;
  }

  /*
  ================================================
  🔥 TURNING POINT SYNC
  ================================================
  */

  if (matchId) {

    const highlights = getHighlights(matchId);

    const last = highlights[highlights.length - 1];

    if (last?.type === "TURNING_POINT") {
      momentum += 12; // 🔥 BIG SPIKE
    }

    if (last?.type === "BOUNDARY_CLUSTER") {
      momentum += 6;
    }

    if (last?.type === "LAST_OVER_THRILLER") {
      momentum += 10;
    }

    if (last?.type === "HAT_TRICK_THREAT") {
      momentum += 8;
    }
  }

  /*
  ================================================
  🔻 DECAY (SMOOTH)
  ================================================
  */

  momentum = momentum * 0.92; // smooth decay instead of -1
  momentum = Math.max(0, Math.min(momentum, 100));

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