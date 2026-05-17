import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";
import { createMatchId } from "@/services/match/createLiveMatchId";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

const MATCH_LIST_KEY = "matches:list";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const body = await req.json();

  const teamA = body?.teamA?.trim();
  const teamB = body?.teamB?.trim();

  if (!teamA || !teamB) {
    return NextResponse.json({ error: "Teams required" }, { status: 400 });
  }

  const matchId = createMatchId(teamA, teamB);

  const redis = getRedis();

  const match = {
    matchId,
    slug: matchId,
    teamA,
    teamB,
    status: "UPCOMING",
    createdAt: Date.now(),
  };

  await redis.hset(`match:${matchId}:meta`, match);
  await redis.sadd(MATCH_LIST_KEY, matchId);

  await upsertMatchRegistry({
    matchId,
    slug: matchId,
    teamA,
    teamB,
    status: "UPCOMING",
    type: "SIMULATION",
    sourceType: "SIMULATION",
    isLiveConnected: false,
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
  });

  logAuthSensitiveAction("create_match_legacy", {
    route: "/api/match",
    matchId,
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

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
