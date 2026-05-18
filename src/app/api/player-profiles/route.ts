import { NextRequest, NextResponse } from "next/server";
import { createPlayerProfile, listPlayerProfiles } from "@/lib/repositories/playerProfile.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET() {
  const players = await listPlayerProfiles();
  return NextResponse.json({ success: true, data: players });
}

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    displayName?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    role?: string;
    statsSnapshot?: Record<string, unknown>;
  };

  const displayName = body.displayName?.trim();
  if (!displayName) {
    return NextResponse.json({ success: false, error: "displayName is required" }, { status: 400 });
  }

  const profile = await createPlayerProfile({
    userId: access.session.userId,
    displayName,
    battingStyle: body.battingStyle,
    bowlingStyle: body.bowlingStyle,
    role: body.role,
    statsSnapshot: body.statsSnapshot,
  });

  return NextResponse.json({ success: true, data: profile }, { status: 201 });
}
