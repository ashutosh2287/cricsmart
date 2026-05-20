import { subscribeDomainEvent } from "@/domain/eventBus";
import type { BallDomainEvent } from "@/domain/events";

const latestBallByMatch = new Map<string, BallDomainEvent>();

export function initAnalyticsConsumer() {
  subscribeDomainEvent("BALL", (event) => {
    latestBallByMatch.set(event.runtimeMatchId, event);
  });
}

export function getLatestAnalyticsSeed(runtimeMatchId: string) {
  return latestBallByMatch.get(runtimeMatchId);
}
