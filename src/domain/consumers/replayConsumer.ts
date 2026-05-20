import { subscribeDomainEvent } from "@/domain/eventBus";
import { appendEventTimeline } from "@/services/replay/eventTimeline";
import { appendCommentaryTimeline } from "@/services/commentary/commentaryTimelineStore";

let replayConsumerRegistered = false;

async function appendReplayEvent(matchId: string, payload: unknown) {
  // Domain replay persistence is server-side only.
  if (typeof window !== "undefined") return;
  try {
    const { appendEvent } = await import("@/services/storage/eventStorage");
    await appendEvent(matchId, payload as never);
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

  subscribeDomainEvent("COMMENTARY", (event) => {
    appendCommentaryTimeline({
      matchId: event.runtimeMatchId,
      eventId: event.commentaryId,
      sequence: event.timestamp,
      timestamp: event.timestamp,
      text: event.text,
      source: "ENGINE",
    });

    void appendReplayEvent(event.runtimeMatchId, event);
  });
}
