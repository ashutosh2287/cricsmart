import { NextRequest, NextResponse } from "next/server";
import { requireRouteAccess } from "@/services/auth/routeGuard";
import { StartMatchError, startMatch } from "@/services/matches/startMatch";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const data = await startMatch({
      hostedMatchId: id,
      userId: access.session.userId,
    });

    return NextResponse.json({
      success: true,
      runtimeMatchId: data.runtimeMatchId,
      data,
    });
  } catch (error) {
    if (error instanceof StartMatchError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }

    console.error("Failed to start hosted match", { hostedMatchId: id, error });
    return NextResponse.json({ success: false, error: "Failed to start match" }, { status: 500 });
  }
}
