import { NextRequest, NextResponse } from "next/server";
import { stopSimulation } from "@/services/simulation/matchSimulator";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const { matchId } = await req.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  stopSimulation(matchId);
  logAuthSensitiveAction("stop_simulation", {
    route: "/api/simulation/stop",
    matchId,
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

  return NextResponse.json({ success: true });
}
