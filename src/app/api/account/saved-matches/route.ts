import { NextRequest, NextResponse } from "next/server";
import { listSavedMatches } from "@/lib/repositories/community.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const saved = await listSavedMatches(access.session.userId);
  return NextResponse.json({ success: true, data: saved });
}
