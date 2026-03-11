import { BallEvent } from "@/types/ballEvent";

const partnershipRuns: Record<string, number> = {};

export function processPartnershipEvent(
  matchId: string,
  event: BallEvent
) {

  if (!partnershipRuns[matchId]) {
    partnershipRuns[matchId] = 0;
  }

  if (event.wicket) {
    partnershipRuns[matchId] = 0;
    return;
  }

  partnershipRuns[matchId] += event.runs ?? 0;

}

export function getPartnershipRuns(matchId: string) {
  return partnershipRuns[matchId] ?? 0;
}