import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent } from "@/services/matchEngine";

type EventListener = (event: BallEvent) => void;

/*
=====================================
ROUTED LISTENERS (UI direct listeners)
=====================================
*/

const routes: Record<string, Set<EventListener>> = {};

/*
=====================================
SUBSCRIBE TO EVENT (OPTIONAL UI HOOK)
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
DISPATCH EVENT (MASTER ENTRY)
=====================================
*/

export function dispatchEvent(event: BallEvent) {

  console.log("DISPATCH EVENT slug:", event.slug);

  routes[event.slug]?.forEach(listener => {
    listener(event);
  });

  dispatchBallEvent(event.slug, event);
}

