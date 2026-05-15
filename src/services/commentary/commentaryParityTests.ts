import type { EventSourceType } from "@/types/ballEvent";
import { validateCommentaryParity } from "./commentaryParityValidator";

const PARITY_SOURCES: EventSourceType[] = ["LIVE_INGESTION", "MOCK_INGESTION", "SIMULATION", "REPLAY"];

export type CommentaryParitySourceMatches = Partial<Record<EventSourceType, string>>;

export function runCommentaryParitySourceTest(sourceMatches: CommentaryParitySourceMatches) {
  const baseline = sourceMatches.LIVE_INGESTION;
  if (!baseline) {
    return {
      pass: false,
      reason: "missing_live_ingestion_baseline",
    };
  }

  for (const source of PARITY_SOURCES) {
    const matchId = sourceMatches[source];
    if (!matchId) {
      return {
        pass: false,
        reason: `missing_match_for_${source}`,
      };
    }

    if (source === "LIVE_INGESTION") continue;

    const parity = validateCommentaryParity(baseline, matchId);
    if (!parity.equal) {
      return {
        pass: false,
        reason: parity.reason,
        baseline,
        comparedSource: source,
        comparedMatch: matchId,
      };
    }
  }

  return {
    pass: true,
    reason: "identical_context_outputs",
  };
}
