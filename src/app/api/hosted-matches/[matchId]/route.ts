import { NextRequest, NextResponse } from "next/server";
import { MatchStatus } from "@prisma/client";
import {
  deleteHostedMatchByOwner,
  getHostedMatchById,
  hasHostedMatchControlAccess,
  updateHostedMatchByOwner,
} from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";
import { getAuthSessionFromRequest } from "@/services/auth/sessionStore";

export async function GET(req: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await context.params;
  const hostedMatch = await getHostedMatchById(matchId);

  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  if (hostedMatch.visibility !== "PUBLIC") {
    const session = await getAuthSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Hosted match not available" }, { status: 404 });
    }

    const canAccess =
      session.user.role === "admin" ||
      session.user.role === "internal" ||
      (await hasHostedMatchControlAccess(matchId, session.userId, session.user.role));
    if (!canAccess) {
      return NextResponse.json({ success: false, error: "Hosted match not available" }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true, data: hostedMatch, hostedMatch });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await context.params;
  const body = (await req.json()) as {
    title?: string;
    format?: string;
    venue?: string | null;
    startTime?: string;
    status?: string;
    visibility?: string;
    scoringMode?: string;
  };

  const status = body.status?.trim().toUpperCase();
  const normalizedStatus =
    status === MatchStatus.DRAFT || status === MatchStatus.LIVE || status === MatchStatus.COMPLETED
      ? status
      : undefined;

  const updated = await updateHostedMatchByOwner(matchId, access.session.userId, {
    title: body.title,
    format: body.format,
    venue: body.venue,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    status: normalizedStatus,
    visibility: body.visibility,
    scoringMode: body.scoringMode,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await context.params;
  const deleted = await deleteHostedMatchByOwner(matchId, access.session.userId);

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
