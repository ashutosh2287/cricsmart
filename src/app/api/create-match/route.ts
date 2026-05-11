import { initMatch, getMatchState } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getRedis } from "@/services/storage/redisClient";
import { upsertMatchRegistry } from "@/services/match/matchRegistry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teamA = body?.teamA?.trim();
    const teamB = body?.teamB?.trim();

    // ====================================================
    // ✅ VALIDATION
    // ====================================================
    if (!teamA || !teamB) {
      return Response.json(
        { success: false, error: "teamA and teamB are required" },
        { status: 400 }
      );
    }

    // ====================================================
    // ✅ GENERATE MATCH ID (CONSISTENT)
    // ====================================================
    const normalize = (name: string) =>
      name.toLowerCase().replace(/\s+/g, "-");

    const matchId = `${normalize(teamA)}-vs-${normalize(teamB)}-${Date.now()}`;

    console.log("🆕 Creating match:", matchId);

    // ====================================================
    // 🔥 INIT MATCH ENGINE
    // ====================================================
    initMatch(matchId);

    const state = getMatchState(matchId);

    console.log("🧠 STATE AFTER INIT:", state ? "✅ exists" : "❌ null");

    if (!state) {
      return Response.json(
        { success: false, error: "Failed to initialize match state" },
        { status: 500 }
      );
    }

    // ====================================================
    // 🔥 REDIS CONNECTION TEST
    // ====================================================
    const redis = getRedis();

    await redis.set("health-check", "ok");
    const test = await redis.get("health-check");

    console.log("🧪 REDIS TEST:", test);

    // ====================================================
    // 🔥 SAVE TO REDIS (SINGLE SOURCE)
    // ====================================================
    const storage = new RedisSimulationStorage();

    console.log("💾 SAVING MATCH TO REDIS:", matchId);

    await storage.save(matchId, state, {
      isRunning: false,
      isPaused: false,
      speed: 1,
    });

    await upsertMatchRegistry({
      matchId,
      teamA,
      teamB,
      status: "UPCOMING",
      type: "SIMULATION",
      isLiveConnected: false,
      heartbeatFresh: false,
      reconnectHealth: "disconnected",
    });

    // ====================================================
    // 🔍 VERIFY SAVE (CRITICAL)
    // ====================================================
    console.log("🔍 VERIFYING REDIS SAVE...");

    const verify = await storage.load(matchId);

    console.log(
      "🔍 VERIFY RESULT:",
      verify ? "✅ FOUND" : "❌ NOT FOUND"
    );

    if (!verify) {
      return Response.json(
        { success: false, error: "Failed to persist match to Redis" },
        { status: 500 }
      );
    }

    // ====================================================
    // ✅ SUCCESS RESPONSE
    // ====================================================
    return Response.json({
      success: true,
      matchId,
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