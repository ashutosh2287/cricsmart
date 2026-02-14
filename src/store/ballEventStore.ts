import { BallEvent } from "@/types/ballEvent";

// ⭐ MatchSlug → BallEvent[]
const events: Record<string, BallEvent[]> = {};

// ⭐ MatchSlug → listeners array
const listeners: Record<string, Array<() => void>> = {};

export function addBallEvent(matchSlug: string, event: BallEvent) {

  if (!events[matchSlug]) {
    events[matchSlug] = [];
  }

  // 🔥 create new reference so React detects update
  events[matchSlug] = [...events[matchSlug], event];

  if (listeners[matchSlug]) {
    listeners[matchSlug].forEach((cb: () => void) => cb());
  }
}

export function getBallEvents(matchSlug: string): BallEvent[] {
  return events[matchSlug] ?? [];
}

export function subscribeBallEvents(
  matchSlug: string,
  cb: () => void
) {

  if (!listeners[matchSlug]) {
    listeners[matchSlug] = [];
  }

  listeners[matchSlug].push(cb);

  return () => {
    listeners[matchSlug] =
      listeners[matchSlug].filter((l) => l !== cb);
  };
}
