import { NextRequest, NextResponse } from "next/server";
import { setSimulationSpeed } from "@/services/simulation/matchSimulator";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const { matchId, speed } = await req.json();

  if (!matchId || typeof speed !== "number") {
    return NextResponse.json(
      { error: "matchId + speed required" },
      { status: 400 }
    );
  }

  setSimulationSpeed(speed, matchId);
  logAuthSensitiveAction("set_simulation_speed", {
    route: "/api/simulation/speed",
    matchId,
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

  return NextResponse.json({ success: true, speed });
}
