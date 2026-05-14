import { NextRequest, NextResponse } from "next/server";
import { getCommentaryContextDiagnostics } from "@/services/commentary/commentaryContextSnapshotStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId") ?? undefined;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...getCommentaryContextDiagnostics(matchId),
  });
}
