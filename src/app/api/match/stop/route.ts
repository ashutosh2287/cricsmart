import { NextRequest, NextResponse } from "next/server";
import { stopMatch } from "@/services/match/matchManager";
import { stopLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import { resetMatchState } from "@/services/matchEngine";
import { stopWorker } from "@/services/queue/eventWorker";
import { markMatchStopped } from "@/services/match/matchRegistry";

/* ========================= */
/* API: STOP MATCH */
/* ========================= */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "Missing matchId" },
        { status: 400 }
      );
    }

    console.log("🛑 STOP MATCH:", matchId);

    /* ========================= */
    /* 🔥 STOP INGESTION */
    /* ========================= */
    stopLiveMatchIngestor(matchId);

    /* ========================= */
    /* 🔥 STOP MATCH LIFECYCLE */
    /* ========================= */
    stopMatch(matchId);

    /* ========================= */
    /* 🔥 RESET ENGINE STATE */
    /* ========================= */
    resetMatchState(matchId);

    /* ========================= */
    /* 🔥 STOP WORKER */
    /* ========================= */
    stopWorker(matchId);

    await markMatchStopped(matchId);

    return NextResponse.json({
      success: true,
      matchId,
    });
  } catch (error) {
    console.error("❌ STOP ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to stop match" },
      { status: 500 }
    );
  }
}