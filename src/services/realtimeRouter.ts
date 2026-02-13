import { RealtimeEvent } from "../types/realtime";
import { Match } from "../types/match";

type RouterHandlers = {
  onMatchUpdate?: (match: Match) => void;
  onCommentaryUpdate?: (data: string[]) => void;
};

export function createRealtimeRouter(
  eventSource: EventSource,
  handlers: RouterHandlers
) {

  eventSource.onmessage = (event) => {

    const data: RealtimeEvent = JSON.parse(event.data);

    switch (data.type) {

      case "match_update":
        handlers.onMatchUpdate?.(data.payload);
        break;

      case "commentary_update":
        handlers.onCommentaryUpdate?.(data.payload);
        break;

    }

  };

}
