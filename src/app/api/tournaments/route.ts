import { NextRequest, NextResponse } from "next/server";
import { createTournament, listTournamentsPublic } from "@/lib/repositories/tournament.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET() {
  const tournaments = await listTournamentsPublic();
  return NextResponse.json({ success: true, data: tournaments });
}

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    format?: string;
    location?: string;
    bannerUrl?: string;
    startDate?: string;
    endDate?: string;
    visibility?: string;
  };

  const name = body.name?.trim();
  if (!name || !body.startDate || !body.endDate) {
    return NextResponse.json({ success: false, error: "name, startDate and endDate are required" }, { status: 400 });
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return NextResponse.json({ success: false, error: "Invalid tournament dates" }, { status: 400 });
  }

  const tournament = await createTournament({
    name,
    organizerId: access.session.userId,
    format: body.format,
    location: body.location,
    bannerUrl: body.bannerUrl,
    startDate,
    endDate,
    visibility: body.visibility?.trim() || "PUBLIC",
  });

  return NextResponse.json({ success: true, data: tournament }, { status: 201 });
}
