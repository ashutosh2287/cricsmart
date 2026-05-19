import { eventBus } from "@/domain/eventBus";
import type { BallEvent } from "@/domain/events/BallEvent";
import { appendEventTimeline } from "@/services/replay/eventTimeline";

const replaySequenceByMatch = new Map<string, number>();

function nextSequence(runtimeMatchId: string) {
  const current = replaySequenceByMatch.get(runtimeMatchId) ?? 0;
  const next = current + 1;
  replaySequenceByMatch.set(runtimeMatchId, next);
  return next;
}

async function appendReplayStream(event: BallEvent, sequence: number) {
  if (typeof window !== "undefined") return;

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
      eventType: event.type,
    });

    appendReplayStream(event, sequence).catch(console.error);
  });
}
