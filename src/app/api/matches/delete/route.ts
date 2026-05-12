import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

const MATCH_LIST_KEY = "matches:list";
const getMatchMetaKey = (matchId: string) => `match:${matchId}:meta`;

export async function DELETE(req: NextRequest) {
  try {
    const { matchId } = await req.json();

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const storage = new RedisSimulationStorage();

    // Remove from registry list and meta hash
    await redis.srem(MATCH_LIST_KEY, matchId);
    await redis.del(getMatchMetaKey(matchId));

    // Remove simulation state
    await storage.delete(matchId);

    return NextResponse.json({ success: true, matchId });
  } catch (err) {
    console.error("❌ DELETE MATCH ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
