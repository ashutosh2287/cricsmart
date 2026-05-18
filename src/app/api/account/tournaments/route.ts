import { NextRequest, NextResponse } from "next/server";
import { listTournamentsByOrganizer } from "@/lib/repositories/tournament.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tournaments = await listTournamentsByOrganizer(access.session.userId);
  return NextResponse.json({ success: true, data: tournaments });
}
