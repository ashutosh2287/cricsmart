import { eventBus } from "@/domain/eventBus";
import type { BallEvent } from "@/domain/events/BallEvent";
import { appendEventTimeline } from "@/services/replay/eventTimeline";

const replaySequenceByMatch = new Map<string, number>();
const canPersistReplayStream = typeof window === "undefined";

function nextSequence(runtimeMatchId: string) {
  const current = replaySequenceByMatch.get(runtimeMatchId) ?? 0;
  const next = current + 1;
  replaySequenceByMatch.set(runtimeMatchId, next);
  return next;
}

function resolveReplayEventType(event: BallEvent) {
  if (event.isWicket) return "WICKET";
  if (event.isBoundary && event.runs >= 6) return "SIX";
  if (event.isBoundary && event.runs >= 4) return "FOUR";
  return "RUN";
}

async function appendReplayStream(event: BallEvent, sequence: number) {
  try {
    const { getRedis } = await import("@/services/storage/redisClient");
    const redis = getRedis();

    await redis.rpush(
      `match:${event.runtimeMatchId}:replay_stream`,
      JSON.stringify({ sequence, ...event })
    );
  } catch (error) {
    console.warn("Replay stream append failed", error);
  }
}

export function initReplayConsumer() {
  eventBus.on("BALL", (event) => {
    const sequence = nextSequence(event.runtimeMatchId);

    appendEventTimeline(event.runtimeMatchId, {
      eventId: `${event.runtimeMatchId}:${sequence}`,
      sequence,
      timestamp: event.timestamp,
      matchId: event.runtimeMatchId,
      innings: event.innings,
      over: event.over,
      ball: event.ball,
      eventType: resolveReplayEventType(event),
    });

    if (canPersistReplayStream) {
      appendReplayStream(event, sequence).catch(console.error);
    }
  });
}
