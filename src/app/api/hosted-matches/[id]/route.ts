import { NextRequest, NextResponse } from "next/server";
import {
  deleteHostedMatchByOwner,
  getHostedMatchById,
  hasHostedMatchControlAccess,
  updateHostedMatchByOwner,
} from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";
import { getAuthSessionFromRequest } from "@/services/auth/sessionStore";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const hostedMatch = await getHostedMatchById(id);

  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  if (hostedMatch.visibility !== "PUBLIC") {
    const session = await getAuthSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Hosted match not available" }, { status: 404 });
    }

    const canAccess = await hasHostedMatchControlAccess(id, session.userId, session.role);
    if (!canAccess) {
      return NextResponse.json({ success: false, error: "Hosted match not available" }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true, data: hostedMatch });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as {
    title?: string;
    format?: string;
    venue?: string | null;
    startTime?: string;
    status?: string;
    visibility?: string;
    scoringMode?: string;
  };

  const updated = await updateHostedMatchByOwner(id, access.session.userId, {
    title: body.title,
    format: body.format,
    venue: body.venue,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    status: body.status,
    visibility: body.visibility,
    scoringMode: body.scoringMode,
  });

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
  const deleted = await deleteHostedMatchByOwner(id, access.session.userId);

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
