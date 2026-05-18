import { NextRequest, NextResponse } from "next/server";
import { findHostedMatchById } from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hostedMatchId: string }> }
) {
  const access = await requireRouteAccess({ req, scope: "admin" });
  if (!access.ok) return access.response;

  try {
    const { hostedMatchId } = await context.params;
    if (!hostedMatchId) {
      return NextResponse.json(
        { success: false, message: "Invalid hostedMatchId" },
        { status: 400 }
      );
    }

    const hostedMatch = await findHostedMatchById(hostedMatchId);
    if (!hostedMatch) {
      return NextResponse.json(
        { success: false, message: "Hosted match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hostedMatch,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch hosted match",
      },
      { status: 500 }
    );
  }
}
