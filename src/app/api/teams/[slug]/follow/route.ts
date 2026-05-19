import { NextRequest, NextResponse } from "next/server";
import { followTeam, unfollowTeam } from "@/lib/repositories/community.repository";
import { findTeamBySlugOrId } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const team = await findTeamBySlugOrId(slug);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  await followTeam(access.session.userId, team.id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const team = await findTeamBySlugOrId(slug);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  await unfollowTeam(access.session.userId, team.id);
  return NextResponse.json({ success: true });
}
