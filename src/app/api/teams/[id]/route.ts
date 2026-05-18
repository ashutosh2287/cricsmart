import { NextRequest, NextResponse } from "next/server";
import { deleteTeamByOwner, getTeamById, updateTeamByOwner } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const team = await getTeamById(id);

  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: team });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as {
    name?: string;
    shortName?: string;
    city?: string | null;
    logoUrl?: string | null;
  };

  const updated = await updateTeamByOwner(id, access.session.userId, body);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteTeamByOwner(id, access.session.userId);

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
