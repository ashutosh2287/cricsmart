import { createRealtimeRouter } from "./realtimeRouter";
import { Match } from "../types/match";
import { updateMatch } from "@/store/realtimeStore";


let eventSource: EventSource | null = null;

type Handlers = {
  onMatchUpdate?: (match: Match) => void;
};

const subscribers: Handlers[] = [];

export function startGlobalRealtime() {

  if (eventSource) return; // prevent multiple connections

  eventSource = new EventSource("/api/realtime");

  createRealtimeRouter(eventSource, {

    onMatchUpdate: (match) => {

  // update global store
  updateMatch(match);

  subscribers.forEach(sub => {
    sub.onMatchUpdate?.(match);
  });

}


  });

}

export function subscribeGlobalRealtime(handler: Handlers) {

  subscribers.push(handler);

  return () => {

    const index = subscribers.indexOf(handler);

    if (index !== -1) {
      subscribers.splice(index, 1);
    }

  };

}
