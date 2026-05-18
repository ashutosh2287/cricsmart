import { NextRequest, NextResponse } from "next/server";
import { createTeam, listTeams } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET() {
  const teams = await listTeams();
  return NextResponse.json({ success: true, data: teams });
}

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    shortName?: string;
    city?: string;
    logoUrl?: string;
  };

  const name = body.name?.trim();
  const shortName = body.shortName?.trim();

  if (!name || !shortName) {
    return NextResponse.json({ success: false, error: "name and shortName are required" }, { status: 400 });
  }

  const team = await createTeam({
    ownerId: access.session.userId,
    name,
    shortName,
    city: body.city,
    logoUrl: body.logoUrl,
  });

  return NextResponse.json({ success: true, data: team }, { status: 201 });
}
