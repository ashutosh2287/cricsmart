import type { DomainEvent, DomainEventByType, DomainEventType } from "@/domain/events";

type Handler<T extends DomainEventType> = (event: DomainEventByType<T>) => void;

type HandlerMap = {
  [K in DomainEventType]: Set<Handler<K>>;
};

const handlers: HandlerMap = {
  BALL: new Set(),
  WICKET: new Set(),
  MATCH_FINISHED: new Set(),
  WIN_PROBABILITY: new Set(),
};

export function subscribeDomainEvent<T extends DomainEventType>(
  type: T,
  handler: Handler<T>
): () => void {
  const typedHandlers = handlers[type] as Set<Handler<T>>;
  typedHandlers.add(handler);
  return () => {
    typedHandlers.delete(handler);
  };
}

export function emitDomainEvent<T extends DomainEventType>(
  type: T,
  event: DomainEventByType<T>
): void {
  const typedHandlers = handlers[type] as Set<Handler<T>>;
  typedHandlers.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      console.error("DOMAIN_EVENT_HANDLER_ERROR", { type, error });
    }
  });
}

export function emitDomainEventObject(event: DomainEvent): void {
  emitDomainEvent(event.type, event as never);
}
