import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "@/services/broadcastTimeline";
import { handleAnimation } from "@/services/animationOrchestrator";

type EventListener = (event: BallEvent) => void;

/*
=====================================
ROUTED LISTENERS
=====================================
*/

// slug → listeners
const routes: Record<string, Set<EventListener>> = {};

/*
=====================================
SUBSCRIBE TO EVENT (optional)
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
DISPATCH EVENT
=====================================
*/

export function dispatchEvent(event: BallEvent) {

  /*
  🔥 1. direct listeners (if any UI subscribes)
  */
  routes[event.slug]?.forEach(listener => {
    listener(event);
  });

  /*
  🔥 2. Broadcast timeline engine
  */
  pushToTimeline(event);

  /*
  🔥 3. GLOBAL ANIMATION ORCHESTRATOR (NEW)
  */
  handleAnimation(event);

}
