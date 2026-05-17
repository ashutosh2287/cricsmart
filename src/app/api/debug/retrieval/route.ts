import { NextRequest, NextResponse } from "next/server";
import { getCommentaryAudit, getLatestCommentaryAudit } from "@/services/commentary/audit/commentaryAuditLog";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "internal" });
  if (!access.ok) return access.response;

  const matchId = req.nextUrl.searchParams.get("matchId") ?? "";
  const entries = matchId ? getCommentaryAudit(matchId) : [];
  const latest = getLatestCommentaryAudit(matchId || undefined);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    matchId: matchId || null,
    retrievalCount: entries.length,
    latestRetrieval: latest
      ? {
          eventId: latest.eventId,
          confidence: latest.confidenceScores.retrieval ?? 0,
          matches: latest.retrievalMatches,
          filters: latest.retrievalFilters ?? {},
          fallbackTriggers: latest.fallbackTriggers,
        }
      : null,
  });
}
