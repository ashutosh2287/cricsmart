import { NextResponse } from "next/server";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getMatchRegistry } from "@/services/match/matchRegistry";

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
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

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
