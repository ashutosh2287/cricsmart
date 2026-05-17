import { setSimulationSpeed } from "@/services/simulation/matchSimulator";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: Request) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  const { speed } = await req.json();

  console.log("⚡ Speed set to:", speed);

  setSimulationSpeed(speed);
  logAuthSensitiveAction("set_speed_global", {
    route: "/api/set-speed",
    role: access.session?.user.role,
    username: access.session?.user.username,
  });

  return Response.json({ success: true });
}
