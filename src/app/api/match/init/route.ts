import { NextRequest, NextResponse } from "next/server";
import { initializeRuntimeMatch } from "@/services/match/runtimeInitializer";
import { ensureSessionRecoveryStarted } from "@/services/runtime/sessionRecoveryBootstrap";
import { logAuthSensitiveAction, requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;

  ensureSessionRecoveryStarted();

  try {
    const body = await req.json();

    const {
      matchId,
      teamA,
      teamB,
      type,
      externalMatchId,
      tossWinner,
      decision,
      seriesName,
      format,
      scheduledStart,
    } = body as {
      matchId?: string;
      teamA?: string;
      teamB?: string;
      type?: "SIMULATION" | "LIVE";
      externalMatchId?: string;
      tossWinner?: string;
      decision?: "BAT" | "BOWL";
      seriesName?: string;
      format?: string;
      scheduledStart?: string;
    };

    if (!matchId || !teamA || !teamB) {
      return NextResponse.json(
        { success: false, message: "Missing fields: matchId, teamA, teamB required" },
        { status: 400 }
      );
    }

    void seriesName;
    void format;
    void scheduledStart;

    const initialized = await initializeRuntimeMatch({
      matchId,
      teamA,
      teamB,
      type,
      externalMatchId: externalMatchId ?? matchId,
      tossWinner,
      decision,
    });

    logAuthSensitiveAction("init_match", {
      route: "/api/match/init",
      matchId,
      role: access.session?.user.role,
      username: access.session?.user.username,
    });

    return NextResponse.json({
      success: true,
      matchId,
      alreadyInitialized: initialized.alreadyInitialized,
    });
  } catch (error) {
    console.error("❌ INIT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to init match" },
      { status: 500 }
    );
  }
}
