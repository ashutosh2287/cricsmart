import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { createDraftSimulationSession } from "@/services/simulation/simulation-orchestrator";

const MATCH_LIST_KEY = "matches:list";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const teamA = body?.teamA?.trim();
  const teamB = body?.teamB?.trim();

  if (!teamA || !teamB) {
    return NextResponse.json({ error: "Teams required" }, { status: 400 });
  }

  const created = await createDraftSimulationSession({ teamA, teamB });

  const match = {
    matchId: created.matchId,
    slug: created.slug,
    teamA,
    teamB,
    status: "UPCOMING",
    createdAt: Date.now(),
  };

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
