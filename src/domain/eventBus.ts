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
  private handlers: {
    [K in EventType]?: EventHandler<DomainEventMap[K]>[];
  } = {};

  on<T extends EventType>(type: T, handler: EventHandler<DomainEventMap[T]>) {
    const existing = this.handlers[type] ?? [];
    this.handlers[type] = [...existing, handler];

    return () => {
      const current = this.handlers[type] ?? [];
      this.handlers[type] = current.filter((candidate) => candidate !== handler);
    };
  }

  emit<T extends EventType>(type: T, event: DomainEventMap[T]) {
    const handlers = this.handlers[type] ?? [];

    for (const handler of handlers) {
      handler(event);
    }
  }
}

export const eventBus = new EventBus();
