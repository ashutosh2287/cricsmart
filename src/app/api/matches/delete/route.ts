import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import {
  MATCH_LIST_KEY,
  getMatchMetaKey,
} from "@/services/match/matchRegistry";
import { getHostedMatchBySlug, hasHostedMatchControlAccess } from "@/lib/repositories/hostedMatch.repository";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export async function DELETE(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;

  try {
    const { matchId } = await req.json();

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    const hostedMatch = await getHostedMatchBySlug(matchId);
    if (hostedMatch && access.session) {
      const canManage = await hasHostedMatchControlAccess(
        hostedMatch.id,
        access.session.userId,
        access.session.role
      );
      if (!canManage) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const redis = getRedis();
    const storage = new RedisSimulationStorage();

    // Remove registry entries atomically
    const multi = redis.multi();
    multi.srem(MATCH_LIST_KEY, matchId);
    multi.del(getMatchMetaKey(matchId));
    await multi.exec();

    // Remove simulation state
    await storage.delete(matchId);
    logAuthSensitiveAction("delete_match", {
      route: "/api/matches/delete",
      matchId,
      role: access.session?.user.role,
      username: access.session?.user.username,
    });

    return NextResponse.json({ success: true, matchId });
  } catch (err) {
    console.error("❌ DELETE MATCH ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
