import { eventBus } from "@/domain/eventBus";
import type { BallEvent } from "@/domain/events/BallEvent";

const latestBallByMatch = new Map<string, BallEvent>();

export function initAnalyticsConsumer() {
  eventBus.on("BALL", (event) => {
    latestBallByMatch.set(event.runtimeMatchId, event);
  });
}

export function getLatestAnalyticsSeed(runtimeMatchId: string) {
  return latestBallByMatch.get(runtimeMatchId);
}
