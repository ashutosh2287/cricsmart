import { BallEvent } from "@/types/ballEvent";

type EventListener = (event: BallEvent) => void;

/*
=====================================
UI EVENT LISTENER HUB
=====================================
*/

const routes: Record<string, Set<EventListener>> = {};

/*
=====================================
SUBSCRIBE
=====================================
*/

export function subscribeEvent(
  slug: string,
  cb: EventListener
) {

  if (!routes[slug]) {
    routes[slug] = new Set();
  }

  routes[slug].add(cb);

  return () => {
    routes[slug].delete(cb);
  };

}

/*
=====================================
EMIT EVENT (called from timeline)
=====================================
*/

export function emitEvent(event: BallEvent) {

  routes[event.slug]?.forEach(listener => {
    listener(event);
  });

}