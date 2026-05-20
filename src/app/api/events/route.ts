import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";
import { dedupeReplayEvents, normalizeReplayEvent } from "@/services/replay/replayEventUtils";

/**
 * 🔹 GET EVENTS (PRIMARY USE)
 */
export async function GET(req: NextRequest) {
  try {
    const matchId = req.nextUrl.searchParams.get("matchId");
    const afterSequenceParam = req.nextUrl.searchParams.get("afterSequence");
    const afterSequence = afterSequenceParam ? Number(afterSequenceParam) : undefined;

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId required" },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const key = `match:${matchId}:events`;

    const events = await redis.lrange(key, 0, -1);

    const parsed = events
      .map((e) => {
        try {
          return JSON.parse(e);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((event, index) => normalizeReplayEvent(event, index + 1));

    const deduped = dedupeReplayEvents(parsed).filter((event) =>
      typeof afterSequence === "number" ? event.sequenceNumber > afterSequence : true
    );

    return NextResponse.json(deduped);
  } catch (error) {
    console.error("❌ GET /api/events failed:", error);

    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * 🔹 DELETE EVENTS (RESET / ADMIN)
 */
export async function DELETE(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  try {
    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId required" },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const key = `match:${matchId}:events`;

    await redis.del(key);
    logAuthSensitiveAction("delete_events", {
      route: "/api/events",
      matchId,
      role: access.session?.user.role,
      username: access.session?.user.username,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE /api/events failed:", error);

    return NextResponse.json(
      { error: "Failed to delete events" },
      { status: 500 }
    );
  }
}

/**
 * ⚠️ OPTIONAL: KEEP ONLY FOR DEBUG / MANUAL INSERT
 * (NOT USED BY ENGINE ANYMORE)
 */
export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  try {
    const { matchId, event } = await req.json();

    if (!matchId || !event) {
      return NextResponse.json(
        { error: "matchId and event required" },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const key = `match:${matchId}:events`;
    const sequenceNumber = Number(await redis.incr(`match:${matchId}:replay_sequence`));
    const now = Date.now();
    const inning =
      typeof event?.inning === "number"
        ? event.inning
        : typeof event?.innings === "number"
          ? event.innings
          : 0;
    const over = typeof event?.over === "number" ? event.over : 0;
    const ball = typeof event?.ball === "number" ? event.ball : 0;

    await redis.rpush(
      key,
      JSON.stringify({
        ...event,
        id:
          typeof event?.id === "string" && event.id.trim()
            ? event.id
            : crypto.randomUUID(),
        sequenceNumber:
          typeof event?.sequenceNumber === "number"
            ? event.sequenceNumber
            : sequenceNumber,
        type: typeof event?.type === "string" ? event.type : "MANUAL",
        timestamp: typeof event?.timestamp === "number" ? event.timestamp : now,
        inning,
        over,
        ball,
        payload: event?.payload ?? event,
        ingestionTimestamp: now,
        eventSource: event?.eventSource ?? "MANUAL",
      })
    );
    logAuthSensitiveAction("append_event_manual", {
      route: "/api/events",
      matchId,
      role: access.session?.user.role,
      username: access.session?.user.username,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ POST /api/events failed:", error);

    return NextResponse.json(
      { error: "Failed to append event" },
      { status: 500 }
    );
  }
}
