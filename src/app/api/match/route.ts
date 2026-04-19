import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";

const MATCH_LIST_KEY = "matches:list";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { teamA, teamB } = body;

  if (!teamA || !teamB) {
    return NextResponse.json({ error: "Teams required" }, { status: 400 });
  }

  const matchId = `${teamA}-vs-${teamB}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  const redis = getRedis();

  const match = {
    matchId,
    teamA,
    teamB,
    status: "UPCOMING",
    createdAt: Date.now(),
  };

  await redis.hset(`match:${matchId}:meta`, match);
  await redis.sadd(MATCH_LIST_KEY, matchId);

  return NextResponse.json({ success: true, match });
}

export async function GET() {
  const redis = getRedis();

  const matchIds = await redis.smembers(MATCH_LIST_KEY);

  const matches = [];

  for (const id of matchIds) {
    const data = await redis.hgetall(`match:${id}:meta`);
    if (data) matches.push(data);
  }

  return NextResponse.json(matches);
}