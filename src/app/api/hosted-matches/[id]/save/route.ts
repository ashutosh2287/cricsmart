import { NextRequest, NextResponse } from "next/server";
import { getHostedMatchById } from "@/lib/repositories/hostedMatch.repository";
import { saveHostedMatch, unsaveHostedMatch } from "@/lib/repositories/community.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const hostedMatch = await getHostedMatchById(id);
  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  await saveHostedMatch(access.session.userId, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await unsaveHostedMatch(access.session.userId, id);
  return NextResponse.json({ success: true });
}
