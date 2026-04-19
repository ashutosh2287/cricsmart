import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";

export async function POST(req: NextRequest) {
  const { matchId, event } = await req.json();

  const redis = getRedis();

  const key = `match:${matchId}:events`;

  await redis.rpush(key, JSON.stringify({
    ...event,
    timestamp: Date.now(),
  }));

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const redis = getRedis();
  const key = `match:${matchId}:events`;

  const events = await redis.lrange(key, 0, -1);

  return NextResponse.json(
    events.map((e) => JSON.parse(e))
  );
}

export async function DELETE(req: NextRequest) {
  const { matchId } = await req.json();

  const redis = getRedis();
  const key = `match:${matchId}:events`;

  await redis.del(key);

  return NextResponse.json({ success: true });
}