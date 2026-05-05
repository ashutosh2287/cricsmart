import { NextResponse } from "next/server";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

export async function GET(
  request: Request,
  context: { params: Promise<{ matchId: string }> } // ✅ use matchId consistently
) {
  try {
    // ✅ unwrap params (IMPORTANT FIX)
    const { matchId } = await context.params;

    console.log("📌 API LOAD MATCH:", matchId);

    // ✅ Safety check
    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "Invalid matchId" },
        { status: 400 }
      );
    }

    const storage = new RedisSimulationStorage();

    const data = await storage.load(matchId);

    console.log("📦 REDIS RESPONSE:", data ? "✅ FOUND" : "❌ NULL");

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    // ✅ SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      match: data.state,
      runtime: data.control ?? {
        isRunning: false,
        isPaused: false,
        speed: 1500,
      },
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