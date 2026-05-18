import { NextRequest, NextResponse } from "next/server";
import { upsertHostedLiveMatch } from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json(
      { success: false, message: "Authenticated session required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const externalMatchId =
      typeof body?.externalMatchId === "string" ? body.externalMatchId.trim() : "";
    const teamA = typeof body?.teamA === "string" ? body.teamA.trim() : "";
    const teamB = typeof body?.teamB === "string" ? body.teamB.trim() : "";

    if (!externalMatchId || !teamA || !teamB) {
      return NextResponse.json(
        {
          success: false,
          message: "externalMatchId, teamA and teamB are required",
        },
        { status: 400 }
      );
    }

    const hostedMatch = await upsertHostedLiveMatch({
      externalMatchId,
      teamA,
      teamB,
      createdById: access.session.userId,
    });

    return NextResponse.json({
      success: true,
      hostedMatch,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upsert hosted match",
      },
      { status: 500 }
    );
  }
}
