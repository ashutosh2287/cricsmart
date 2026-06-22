import { NextRequest, NextResponse } from "next/server";
import { listTournamentsByOrganizer } from "@/lib/repositories/tournament.repository";
import { prisma } from "@/lib/db/prisma";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [organized, memberOf] = await Promise.all([
    listTournamentsByOrganizer(access.session.userId),
    prisma.tournamentMember.findMany({
      where: { userId: access.session.userId },
      include: {
        tournament: {
          include: {
            teams: { include: { team: true } },
            matches: { include: { hostedMatch: true } },
          },
        },
      },
    }),
  ]);

  const organizedIds = new Set(organized.map((t) => t.id));
  const memberTournaments = memberOf
    .map((m) => m.tournament)
    .filter((t) => !organizedIds.has(t.id));

  const allTournaments = [...organized, ...memberTournaments].map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    teamsCount: t.teams.length,
    matchesCount: t.matches.length,
  }));

  return NextResponse.json({ success: true, data: allTournaments });
}
