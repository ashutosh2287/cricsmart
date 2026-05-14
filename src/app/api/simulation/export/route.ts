import { NextRequest, NextResponse } from "next/server";
import { getReplayExport } from "@/services/simulation/simulationReplayExport";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matchId = body?.matchId;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    const exported = getReplayExport(matchId);
    return NextResponse.json({
      success: true,
      matchId,
      exportedAt: new Date(exported.updatedAt).toISOString(),
      eventCount: exported.events.length,
      events: exported.events,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to export replay",
      },
      { status: 500 }
    );
  }
}
