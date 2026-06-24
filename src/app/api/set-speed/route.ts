import { setSimulationSpeed } from "@/services/simulation/matchSimulator";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";

/**
 * @deprecated Use POST /api/simulation/speed with matchId instead.
 * This route affects ALL running simulations.
 */
export async function POST(req: Request) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const { speed } = await req.json();

  console.warn("⚠️ DEPRECATED: /api/set-speed affects ALL simulations. Use /api/simulation/speed with matchId instead.");

  setSimulationSpeed(speed);
  logAuthSensitiveAction("set_speed_global", {
    route: "/api/set-speed",
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

  return Response.json({ success: true, deprecated: true, message: "Use /api/simulation/speed with matchId instead" });
}
