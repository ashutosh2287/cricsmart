import { subscribeCommand, Command } from "./commandBus";
import { getHighlights } from "@/services/highlights/highlightStore";

const momentumByMatch: Record<string, number> = {};
const listenersByMatch: Record<string, Set<(value: number) => void>> = {};

export function subscribeMomentum(matchId: string, cb: (value: number) => void) {
  if (!listenersByMatch[matchId]) listenersByMatch[matchId] = new Set();
  listenersByMatch[matchId].add(cb);
  return () => listenersByMatch[matchId]?.delete(cb);
}

function emitMomentum(matchId: string) {
  const val = momentumByMatch[matchId] ?? 0;
  listenersByMatch[matchId]?.forEach((l) => l(val));
}

function handleCommand(command: Command) {
  const matchId = command.slug;
  if (!matchId) return;

  if (momentumByMatch[matchId] === undefined) momentumByMatch[matchId] = 0;

  switch (command.type) {
    case "RUN_SCORED":
      momentumByMatch[matchId] += 0.5;
      break;
    case "BOUNDARY_FOUR":
      momentumByMatch[matchId] += 2;
      break;
    case "BOUNDARY_SIX":
      momentumByMatch[matchId] += 3;
      break;
    case "WICKET_FALL":
      momentumByMatch[matchId] -= 5;
      break;
    case "DOT_BALL":
      momentumByMatch[matchId] -= 1;
      break;
  }

  const highlights = getHighlights(matchId);
  const last = highlights[highlights.length - 1];

  if (last?.type === "TURNING_POINT") {
    momentumByMatch[matchId] += 6;
  }

  momentumByMatch[matchId] *= 0.9;
  momentumByMatch[matchId] = Math.max(-100, Math.min(100, momentumByMatch[matchId]));

  emitMomentum(matchId);
}

export function initMomentumEngine() {
  subscribeCommand(handleCommand);
}