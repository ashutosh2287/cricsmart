import { NextResponse } from "next/server";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getMatchRegistry } from "@/services/match/matchRegistry";
import {
  cacheMatchSnapshot,
  consumeStaleFallback,
} from "@/services/runtime/snapshotCache";

export async function GET(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "Invalid matchId" },
        { status: 400 }
      );
    }

    const storage = new RedisSimulationStorage();
    const [data, registry] = await Promise.all([
      storage.load(matchId),
      getMatchRegistry(matchId),
    ]);

    if (!data) {
      const stale = consumeStaleFallback(matchId);
      if (stale) {
        return NextResponse.json({
          success: true,
          match: stale.state,
          runtime: {
            isRunning: false,
            isPaused: false,
            speed: 1500,
          },
          registry,
          staleSnapshot: true,
          staleBadge: "STALE",
          staleLastUpdatedAt: new Date(stale.cachedAt).toISOString(),
        });
      }

      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    cacheMatchSnapshot(
      matchId,
      data.state,
      registry?.sourceType ?? (registry?.type === "LIVE" ? "LIVE" : "SIMULATION")
    );

    return NextResponse.json({
      success: true,
      match: data.state,
      runtime: data.control ?? {
        isRunning: false,
        isPaused: false,
        speed: 1500,
      },
      registry,
    });
  } catch (error) {
    console.error("❌ API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
