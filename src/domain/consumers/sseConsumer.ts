import { subscribeDomainEvent } from "@/domain/eventBus";
import { broadcast } from "@/services/realtime/eventBus";

let sseConsumerRegistered = false;

function isDev() {
  return process.env.NODE_ENV !== "production";
}

export function registerSseConsumer(): void {
  if (sseConsumerRegistered) return;
  sseConsumerRegistered = true;

  subscribeDomainEvent("BALL", (event) => {
    if (isDev()) {
      console.log("[BALL_EVENT]", {
        runtimeMatchId: event.runtimeMatchId,
        eventId: event.eventMeta.eventId,
      });
    }

    const innings = event.state.innings[event.state.currentInningsIndex];
    const payload = {
      type: "BALL_EVENT",
      matchId: event.runtimeMatchId,
      data: {
        type: "BALL",
        runtimeMatchId: event.runtimeMatchId,
        score: innings?.runs ?? 0,
        wickets: innings?.wickets ?? 0,
        over: innings?.over ?? 0,
        ball: innings?.ball ?? 0,
        runs: event.ballEvent.runs,
        timestamp: event.ballEvent.timestamp,
        committedState: event.state,
        engineEvent: {
          id: event.ballEvent.id,
        },
        eventMeta: {
          eventId: event.eventMeta.eventId,
          sequence: event.eventMeta.sequence,
          timestamp: event.eventMeta.timestamp,
          matchId: event.runtimeMatchId,
          innings: event.eventMeta.innings,
          over: event.eventMeta.over,
          ball: event.eventMeta.ball,
          eventType: event.eventMeta.eventType,
        },
      },
    } as const;

    if (isDev()) {
      console.log("[SSE_BROADCAST]", payload);
    }

    broadcast(event.runtimeMatchId, payload);
  });

  subscribeDomainEvent("WICKET", (event) => {
    const innings = event.state.innings[event.state.currentInningsIndex];
    const payload = {
      type: "WICKET",
      matchId: event.runtimeMatchId,
      data: {
        type: "WICKET",
        runtimeMatchId: event.runtimeMatchId,
        score: innings?.runs ?? 0,
        wickets: innings?.wickets ?? 0,
        over: innings?.over ?? 0,
        ball: innings?.ball ?? 0,
        dismissedBatsman: event.ballEvent.dismissedBatsman,
        dismissalKind: event.ballEvent.dismissalKind ?? "UNKNOWN",
        timestamp: event.ballEvent.timestamp,
      },
    } as const;

    if (isDev()) {
      console.log("[SSE_BROADCAST]", payload);
    }

    broadcast(event.runtimeMatchId, payload);
  });

  subscribeDomainEvent("MATCH_FINISHED", (event) => {
    const payload = {
      type: "MATCH_FINISHED",
      matchId: event.runtimeMatchId,
      data: {
        type: "MATCH_FINISHED",
        runtimeMatchId: event.runtimeMatchId,
        winner: event.winner,
        winBy: event.winBy,
        timestamp: event.timestamp,
      },
    } as const;

    if (isDev()) {
      console.log("[SSE_BROADCAST]", payload);
    }

    broadcast(event.runtimeMatchId, payload);
  });
}
