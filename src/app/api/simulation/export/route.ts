import { NextRequest, NextResponse } from "next/server";
import { exportRecordingDataset } from "@/services/recording/recordingExporter";
import type { RecordingFormat } from "@/services/recording/recordingStore";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    const matchId = body?.matchId;
    const format = (body?.format ?? "json") as RecordingFormat;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    const exported = await exportRecordingDataset(matchId, format);
    return NextResponse.json({
      success: true,
      matchId,
      format: exported.format,
      metadata: exported.metadata,
      payload: exported.payload,
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
