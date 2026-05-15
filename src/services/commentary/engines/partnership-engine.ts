import type { BallEvent } from "@/types/ballEvent";

type PartnershipSnapshot = {
  runs: number;
  balls: number;
  boundaries: number;
};

export type PartnershipState = {
  runs: number;
  balls: number;
  boundaries: number;
  strength: "NEW" | "SETTLING" | "ESTABLISHED" | "DOMINANT";
  broken: boolean;
};

function getBallRuns(event: BallEvent) {
  return event.totalRuns ?? event.runs ?? 0;
}

export function calculateCurrentPartnership(events: BallEvent[]): PartnershipSnapshot {
  let runs = 0;
  let balls = 0;
  let boundaries = 0;

  let startIndex = events.length - 1;
  if (events[startIndex]?.wicket) {
    startIndex -= 1;
  }

  for (let index = startIndex; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.wicket) break;

    runs += getBallRuns(event);
    if (event.isLegalDelivery) balls += 1;
    if ((event.runs ?? 0) === 4 || (event.runs ?? 0) === 6) {
      boundaries += 1;
    }
  }

  return { runs, balls, boundaries };
}

export function evaluatePartnership(snapshot: PartnershipSnapshot, event: BallEvent): PartnershipState {
  let strength: PartnershipState["strength"] = "NEW";

  if (snapshot.runs >= 25 || snapshot.balls >= 18) strength = "SETTLING";
  if (snapshot.runs >= 45 || (snapshot.runs >= 35 && snapshot.boundaries >= 4)) strength = "ESTABLISHED";
  if (snapshot.runs >= 70 || (snapshot.runs >= 55 && snapshot.boundaries >= 6)) strength = "DOMINANT";

  return {
    ...snapshot,
    strength,
    broken: event.type === "WICKET" && snapshot.runs >= 20,
  };
}
