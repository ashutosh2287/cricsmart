import { NextRequest, NextResponse } from "next/server";
import { getCommentaryMlAuditDiagnostics } from "@/services/commentary/audit/commentaryAuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId") ?? undefined;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    matchId: matchId ?? null,
    ...getCommentaryMlAuditDiagnostics(matchId),
  });
}
