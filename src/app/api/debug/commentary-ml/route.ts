import { NextRequest, NextResponse } from "next/server";
import { getCommentaryMlAuditDiagnostics } from "@/services/commentary/audit/commentaryAuditLog";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "internal" });
  if (!access.ok) return access.response;

  const matchId = req.nextUrl.searchParams.get("matchId") ?? undefined;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    matchId: matchId ?? null,
    ...getCommentaryMlAuditDiagnostics(matchId),
  });
}
