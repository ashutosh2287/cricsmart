import { NextRequest, NextResponse } from "next/server";
import { getHostedMatchById, hasHostedMatchControlAccess } from "@/lib/repositories/hostedMatch.repository";
import { initMatch, getMatchState } from "@/services/matchEngine";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";
import { requireRouteAccess } from "@/services/auth/routeGuard";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hostedMatch = await getHostedMatchById(id);
  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  const canControl = await hasHostedMatchControlAccess(id, access.session.userId, access.session.role);
  if (!canControl) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!hostedMatch.teamA || !hostedMatch.teamB) {
    return NextResponse.json({ success: false, error: "Match teams not configured" }, { status: 400 });
  }

  const matchId = hostedMatch.slug;

  initMatch(matchId);
  const state = getMatchState(matchId);
  if (!state) {
    return NextResponse.json({ success: false, error: "Failed to initialize MatchEngine" }, { status: 500 });
  }

  state.teamA.name = hostedMatch.teamA.name;
  state.teamB.name = hostedMatch.teamB.name;

  const storage = new RedisSimulationStorage();
  await storage.save(matchId, state, {
    isRunning: true,
    isPaused: false,
    speed: 1,
  });

  await upsertMatchRegistry({
    matchId,
    slug: matchId,
    teamA: hostedMatch.teamA.name,
    teamB: hostedMatch.teamB.name,
    status: "LIVE",
    type: "SIMULATION",
    sourceType: "SIMULATION",
    isLiveConnected: true,
    heartbeatFresh: true,
    reconnectHealth: "healthy",
  });

  return NextResponse.json({
    success: true,
    data: {
      matchId,
      matchCenterUrl: `/match/${matchId}`,
      adminUrl: `/hosted-matches/${id}/control`,
      scoreUrl: `/hosted-matches/${id}/score`,
    },
  });
}
