import { NextRequest, NextResponse } from "next/server";
import { pauseSimulation } from "@/services/simulation/matchSimulator";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const { matchId } = await req.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  pauseSimulation(matchId);
  logAuthSensitiveAction("pause_simulation", {
    route: "/api/simulation/pause",
    matchId,
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

  return NextResponse.json({ success: true });
}
