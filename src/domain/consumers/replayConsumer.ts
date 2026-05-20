import { subscribeDomainEvent } from "@/domain/eventBus";
import { appendEventTimeline } from "@/services/replay/eventTimeline";
import { appendCommentaryTimeline } from "@/services/commentary/commentaryTimelineStore";
import type { ReplayEvent } from "@/types/replayEvent";

let replayConsumerRegistered = false;

function toObjectPayload(payload: unknown) {
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : {};
}

async function nextReplaySequence(matchId: string) {
  const { getRedis } = await import("@/services/storage/redisClient");
  const redis = getRedis();
  const sequence = await redis.incr(`match:${matchId}:replay_sequence`);
  return Number(sequence);
}

async function appendReplayEvent(
  matchId: string,
  event: Omit<ReplayEvent, "sequenceNumber"> & { sequenceNumber?: number }
) {
  // Domain replay persistence is server-side only.
  if (typeof window !== "undefined") return;
  try {
    const { appendEvent } = await import("@/services/storage/eventStorage");
    const replayEvent: ReplayEvent = {
      ...event,
      sequenceNumber:
        typeof event.sequenceNumber === "number"
          ? event.sequenceNumber
          : await nextReplaySequence(matchId),
    };
    await appendEvent(matchId, replayEvent as never);
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

    void appendReplayEvent(event.runtimeMatchId, {
      id: event.eventMeta.eventId || event.ballEvent.id || crypto.randomUUID(),
      sequenceNumber: event.eventMeta.sequence,
      type: event.ballEvent.type,
      timestamp: event.eventMeta.timestamp,
      inning: event.eventMeta.innings,
      over: event.eventMeta.over,
      ball: event.eventMeta.ball,
      payload: event.ballEvent,
      ...toObjectPayload(event.ballEvent),
    });
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
  });

  subscribeDomainEvent("MATCH_FINISHED", (event) => {
    void appendReplayEvent(event.runtimeMatchId, {
      id: crypto.randomUUID(),
      type: "MATCH_FINISHED",
      payload: {
        runtimeMatchId: event.runtimeMatchId,
        winner: event.winner,
        winBy: event.winBy,
      },
      timestamp: event.timestamp,
      inning: event.state.currentInningsIndex ?? 0,
      over: event.state.innings[event.state.currentInningsIndex]?.over ?? 0,
      ball: event.state.innings[event.state.currentInningsIndex]?.ball ?? 0,
    });
  });

  subscribeDomainEvent("WIN_PROBABILITY", (event) => {
    void appendReplayEvent(event.runtimeMatchId, {
      id: crypto.randomUUID(),
      type: "WIN_PROBABILITY",
      timestamp: event.timestamp,
      inning: event.innings,
      over: event.over,
      ball: event.ball,
      payload: event,
      ...toObjectPayload(event),
    });
  });
}
