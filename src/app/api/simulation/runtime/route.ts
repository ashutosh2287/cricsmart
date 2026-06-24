import { NextRequest, NextResponse } from "next/server";
import { getSimulationRuntime } from "@/services/simulation/matchSimulator";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  try {
    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId required" },
        { status: 400 }
      );
    }

    const runtime = getSimulationRuntime(matchId);

    return NextResponse.json({
  success: true,
  runtime: runtime ?? {
    isRunning: false,
    isPaused: false,
    speed: 1500,
  },
});
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch runtime" },
      { status: 500 }
    );
  }
}
