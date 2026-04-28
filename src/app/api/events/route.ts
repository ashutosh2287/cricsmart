import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";

/**
 * 🔹 GET EVENTS (PRIMARY USE)
 */
export async function GET(req: NextRequest) {
  try {
    const matchId = req.nextUrl.searchParams.get("matchId");

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
      .filter(Boolean);

    return NextResponse.json(parsed);
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

    await redis.rpush(
      key,
      JSON.stringify({
        ...event,
        timestamp: Date.now(),
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ POST /api/events failed:", error);

    return NextResponse.json(
      { error: "Failed to append event" },
      { status: 500 }
    );
  }
}