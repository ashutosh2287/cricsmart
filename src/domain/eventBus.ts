import type { BallEvent } from "@/domain/events/BallEvent";
import type { MatchFinishedEvent } from "@/domain/events/MatchFinishedEvent";
import type { WicketEvent } from "@/domain/events/WicketEvent";

type DomainEventMap = {
  BALL: BallEvent;
  WICKET: WicketEvent;
  MATCH_FINISHED: MatchFinishedEvent;
};

type EventType = keyof DomainEventMap;
type EventHandler<T> = (event: T) => void;

class EventBus {
  private handlers = new Map<EventType, EventHandler<any>[]>();

  on<T extends EventType>(type: T, handler: EventHandler<DomainEventMap[T]>) {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);

    return () => {
      const current = this.handlers.get(type) ?? [];
      this.handlers.set(
        type,
        current.filter((candidate) => candidate !== handler)
      );
    };
  }

  emit<T extends EventType>(type: T, event: DomainEventMap[T]) {
    const handlers = this.handlers.get(type) ?? [];

    for (const handler of handlers) {
      handler(event);
    }
  }
}

export const eventBus = new EventBus();
