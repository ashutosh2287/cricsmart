import { BallEvent } from "@/types/ballEvent";

const events: Record<string, BallEvent[]> = {};


let listeners: (() => void)[] = [];

export function addBallEvent(matchSlug: string, event: BallEvent) {

  if (!events[matchSlug]) {
    events[matchSlug] = [];
  }

  events[matchSlug].push(event);

  listeners.forEach(l => l());
}

export function getBallEvents(matchSlug: string) {

  return events[matchSlug] || [];
}

export function subscribeBallEvents(cb: () => void) {

  listeners.push(cb);

  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}
