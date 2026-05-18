import { NextRequest, NextResponse } from "next/server";
import { getTournamentById, addTeamToTournament } from "@/lib/repositories/tournament.repository";
import { getTeamById } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const tournament = await getTournamentById(id);
  if (!tournament || tournament.organizerId !== access.session.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { teamId?: string };
  const teamId = body.teamId?.trim();
  if (!teamId) {
    return NextResponse.json({ success: false, error: "teamId is required" }, { status: 400 });
  }

  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  const record = await addTeamToTournament(id, teamId);
  return NextResponse.json({ success: true, data: record });
}
