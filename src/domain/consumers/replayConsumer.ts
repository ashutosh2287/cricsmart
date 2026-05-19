import { subscribeDomainEvent } from "@/domain/eventBus";
import { appendEventTimeline } from "@/services/replay/eventTimeline";
import { appendCommentaryTimeline } from "@/services/commentary/commentaryTimelineStore";

let replayConsumerRegistered = false;

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
  });
}