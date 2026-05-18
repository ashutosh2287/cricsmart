import { NextRequest, NextResponse } from "next/server";
import { getHostedMatchById } from "@/lib/repositories/hostedMatch.repository";
import { addHostedMatchToTournament, getTournamentById } from "@/lib/repositories/tournament.repository";
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

  const body = (await req.json()) as { hostedMatchId?: string };
  const hostedMatchId = body.hostedMatchId?.trim();
  if (!hostedMatchId) {
    return NextResponse.json({ success: false, error: "hostedMatchId is required" }, { status: 400 });
  }

  const hostedMatch = await getHostedMatchById(hostedMatchId);
  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  const record = await addHostedMatchToTournament(id, hostedMatchId);
  return NextResponse.json({ success: true, data: record });
}
