import { NextRequest, NextResponse } from "next/server";
import { stopMatch } from "@/services/match/matchManager";
import { stopLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import { resetMatchState } from "@/services/matchEngine";
import { stopWorker } from "@/services/queue/eventWorker";
import { markMatchStopped, getMatchRegistry } from "@/services/match/matchRegistry";
import { stopLiveSession } from "@/services/live/liveSessionOrchestrator";

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

    const registry = await getMatchRegistry(matchId);
    const isLive = registry?.type === "LIVE";

    if (isLive) {
      await stopLiveSession(matchId);
    } else {
      stopLiveMatchIngestor(matchId);
      stopMatch(matchId);
      stopWorker(matchId);
    }

    resetMatchState(matchId);

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
