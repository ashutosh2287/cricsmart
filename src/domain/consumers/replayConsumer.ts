import { subscribeDomainEvent } from "@/domain/eventBus";
import { appendEventTimeline } from "@/services/replay/eventTimeline";
import { appendCommentaryTimeline } from "@/services/commentary/commentaryTimelineStore";

let replayConsumerRegistered = false;

async function appendReplayEvent(matchId: string, payload: unknown) {
  if (typeof window !== "undefined") return;
  try {
    const { getRedis } = await import("@/services/storage/redisClient");
    await getRedis().rpush(`match:${matchId}:events`, JSON.stringify(payload));
  } catch (error) {
    console.error("REPLAY_EVENT_APPEND_FAILED", { matchId, error });
  }
}

export function registerReplayConsumer(): void {
  if (replayConsumerRegistered) return;
  replayConsumerRegistered = true;

  subscribeDomainEvent("BALL", (event) => {
    appendEventTimeline(event.runtimeMatchId, {
      eventId: event.eventMeta.eventId,
      sequence: event.eventMeta.sequence,
      timestamp: event.eventMeta.timestamp,
      matchId: event.runtimeMatchId,
      innings: event.eventMeta.innings,
      over: event.eventMeta.over,
      ball: event.eventMeta.ball,
      eventType: event.eventMeta.eventType,
    });

    event.commentaryEvents.forEach((commentaryEvent) => {
      appendCommentaryTimeline({
        matchId: event.runtimeMatchId,
        eventId: commentaryEvent.eventId,
        sequence: event.eventMeta.sequence,
        timestamp: commentaryEvent.timestamp,
        text: commentaryEvent.text,
        source: "ENGINE",
      });
    });

    void appendReplayEvent(event.runtimeMatchId, event.ballEvent);
  });

  subscribeDomainEvent("WICKET", (event) => {
    appendEventTimeline(event.runtimeMatchId, {
      eventId: event.eventMeta.eventId,
      sequence: event.eventMeta.sequence,
      timestamp: event.eventMeta.timestamp,
      matchId: event.runtimeMatchId,
      innings: event.eventMeta.innings,
      over: event.eventMeta.over,
      ball: event.eventMeta.ball,
      eventType: "WICKET",
    });

    void appendReplayEvent(event.runtimeMatchId, {
      type: "WICKET",
      runtimeMatchId: event.runtimeMatchId,
      innings: event.eventMeta.innings,
      over: event.eventMeta.over,
      ball: event.eventMeta.ball,
      timestamp: event.eventMeta.timestamp,
      dismissedBatsman: event.ballEvent.dismissedBatsman,
      dismissalKind: event.ballEvent.dismissalKind ?? "UNKNOWN",
    });
  });

  subscribeDomainEvent("MATCH_FINISHED", (event) => {
    void appendReplayEvent(event.runtimeMatchId, {
      type: "MATCH_FINISHED",
      runtimeMatchId: event.runtimeMatchId,
      winner: event.winner,
      winBy: event.winBy,
      timestamp: event.timestamp,
    });
  });

  subscribeDomainEvent("WIN_PROBABILITY", (event) => {
    void appendReplayEvent(event.runtimeMatchId, event);
  });
}
