import { initMatch, getMatchState } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getRedis } from "@/services/storage/redisClient";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";
import { createMatchId } from "@/services/match/createLiveMatchId";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teamA = body?.teamA?.trim();
    const teamB = body?.teamB?.trim();

    if (!teamA || !teamB) {
      return Response.json(
        { success: false, error: "teamA and teamB are required" },
        { status: 400 }
      );
    }

    const matchId = createMatchId(teamA, teamB);

    initMatch(matchId);

    const state = getMatchState(matchId);
    if (!state) {
      return Response.json(
        { success: false, error: "Failed to initialize match state" },
        { status: 500 }
      );
    }

    const redis = getRedis();
    await redis.set("health-check", "ok");

    const storage = new RedisSimulationStorage();
    await storage.save(matchId, state, {
      isRunning: false,
      isPaused: false,
      speed: 1,
    });

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

    const verify = await storage.load(matchId);
    if (!verify) {
      return Response.json(
        { success: false, error: "Failed to persist match to Redis" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      matchId,
      slug: matchId,
    });
  } catch (err) {
    console.error("❌ CREATE MATCH ERROR:", err);

    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create match",
      },
      { status: 500 }
    );
  }
}
