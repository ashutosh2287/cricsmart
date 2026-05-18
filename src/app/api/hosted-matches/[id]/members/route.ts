import { NextRequest, NextResponse } from "next/server";
import { findByEmailOrUsername } from "@/lib/repositories/user.repository";
import {
  getHostedMatchById,
  removeHostedMatchMember,
  upsertHostedMatchMember,
} from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hostedMatch = await getHostedMatchById(id);

  if (!hostedMatch || hostedMatch.createdById !== access.session.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { identifier?: string; role?: string };
  const identifier = body.identifier?.trim();
  const role = body.role?.trim().toUpperCase() || "SCORER";

  if (!identifier) {
    return NextResponse.json({ success: false, error: "identifier is required" }, { status: 400 });
  }

  const targetUser = await findByEmailOrUsername(identifier);
  if (!targetUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const member = await upsertHostedMatchMember({
    hostedMatchId: id,
    userId: targetUser.id,
    role,
  });

  return NextResponse.json({ success: true, data: member });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hostedMatch = await getHostedMatchById(id);

  if (!hostedMatch || hostedMatch.createdById !== access.session.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { userId?: string };
  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  await removeHostedMatchMember(id, userId);
  return NextResponse.json({ success: true });
}
