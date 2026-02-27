import { getNarrativeState } from "./narrative/narrativeEngine";
import { getEventStream } from "./matchEngine";

export function compareBranches(
  matchId: string,
  branchA: string,
  branchB: string
) {
  const narrativeA = getNarrativeState(matchId, branchA);
  const narrativeB = getNarrativeState(matchId, branchB);

  const timeline = getEventStream(matchId);

  return {
    branchA: {
      arc: narrativeA?.currentArc,
      eventCount: timeline.filter(
        e => e.valid && e.branchId === branchA
      ).length
    },
    branchB: {
      arc: narrativeB?.currentArc,
      eventCount: timeline.filter(
        e => e.valid && e.branchId === branchB
      ).length
    }
  };
}