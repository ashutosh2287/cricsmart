import { NextRequest, NextResponse } from "next/server";
import { getTeamById, removeTeamMemberByOwner } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const team = await getTeamById(id);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  if (team.ownerId !== access.session.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { userId?: string };
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  const removed = await removeTeamMemberByOwner(id, access.session.userId, userId);
  if (!removed) {
    return NextResponse.json({ success: false, error: "Failed to remove member" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
