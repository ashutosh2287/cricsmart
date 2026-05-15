import type {
  CommentaryContext,
  CommentaryNarrativeState,
} from "./commentaryContextTypes";

const narrativeStore: Record<string, CommentaryNarrativeState> = {};

function key(matchId: string, branchId: string) {
  return `${matchId}:${branchId}`;
}

function deriveNarratives(context: CommentaryContext): string[] {
  const narratives: string[] = [];

  if (context.collapseRisk >= 0.65) narratives.push("collapse underway");
  if (context.rebuildStatus === "rebuilding") narratives.push("rebuilding innings");
  if (context.accelerationStatus === "accelerating") narratives.push("batting acceleration");
  if (context.pressureLevel === "high" || context.pressureLevel === "extreme") {
    narratives.push("pressure mounting");
  }
  if (context.momentumState === "collapsing") narratives.push("momentum reversal");
  if (context.phaseOfMatch === "chaseClimax") narratives.push("clutch chase finish");
  if (context.chaseNarrative.includes("under control")) narratives.push("dominant chase");
  if (!narratives.length) narratives.push("match in equilibrium");

  return narratives;
}

export function evolveCommentaryNarrative(context: CommentaryContext): CommentaryNarrativeState {
  const storeKey = key(context.matchId, context.branchId);
  const previous = narrativeStore[storeKey];
  const activeNarratives = deriveNarratives(context);

  const history = previous
    ? [...previous.history, ...activeNarratives.filter((item) => !previous.activeNarratives.includes(item))]
    : [...activeNarratives];

  const next: CommentaryNarrativeState = {
    matchId: context.matchId,
    branchId: context.branchId,
    eventId: context.eventId,
    activeNarratives,
    history,
  };

  narrativeStore[storeKey] = next;
  return next;
}

export function getCommentaryNarrative(matchId: string, branchId = "main") {
  return narrativeStore[key(matchId, branchId)] ?? null;
}

export function resetCommentaryNarrative(matchId: string, branchId = "main") {
  delete narrativeStore[key(matchId, branchId)];
}
