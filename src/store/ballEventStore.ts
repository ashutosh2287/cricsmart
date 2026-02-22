import { BallEvent } from "@/types/ballEvent";

/*
========================================
EVENT HISTORY (optional — replay / debugging)
========================================
*/

const events: Record<string, BallEvent[]> = {};

/*
========================================
ADD BALL EVENT (ENGINE ENTRY POINT)
========================================
*/

export function addBallEvent(event: BallEvent) {

  const matchSlug = event.slug;

  // store history (optional but useful)
  if (!events[matchSlug]) {
    events[matchSlug] = [];
  }

  events[matchSlug].push(event);

  // 🔥 ENTERPRISE EVENT ROUTING
}

/*
(optional debugging / replay access)
*/

export function getBallEvents(matchSlug: string) {
  return events[matchSlug] ?? [];
}
