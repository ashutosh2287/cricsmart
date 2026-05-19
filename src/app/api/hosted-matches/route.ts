import { NextRequest, NextResponse } from "next/server";
import { createHostedMatch, listHostedMatchesPublic } from "@/lib/repositories/hostedMatch.repository";
import { getTeamById } from "@/lib/repositories/team.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const hostedMatches = await listHostedMatchesPublic();
  return NextResponse.json({ success: true, data: hostedMatches });
}

export async function POST(req: NextRequest) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    format?: string;
    venue?: string;
    startTime?: string;
    teamAId?: string;
    teamBId?: string;
    visibility?: string;
    scoringMode?: string;
  };

  const title = body.title?.trim();
  const format = body.format?.trim() || "T20";
  const teamAId = body.teamAId?.trim();
  const teamBId = body.teamBId?.trim();
  const startTime = body.startTime ? new Date(body.startTime) : new Date();

  if (!title || !teamAId || !teamBId) {
    return NextResponse.json({ success: false, error: "title, teamAId and teamBId are required" }, { status: 400 });
  }

  if (teamAId === teamBId) {
    return NextResponse.json({ success: false, error: "teamAId and teamBId must be different" }, { status: 400 });
  }

  const [teamA, teamB] = await Promise.all([getTeamById(teamAId), getTeamById(teamBId)]);
  if (!teamA || !teamB) {
    return NextResponse.json({ success: false, error: "Invalid teams" }, { status: 400 });
  }

  const ownsTeamA = teamA.ownerId === access.session.userId;
  const ownsTeamB = teamB.ownerId === access.session.userId;
  if (!ownsTeamA || !ownsTeamB) {
    return NextResponse.json(
      { success: false, error: "You must own both participating teams to create this hosted match" },
      { status: 403 },
    );
  }

  const slugBase = toSlug(title) || "hosted-match";
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const hostedMatch = await createHostedMatch({
    slug,
    title,
    format,
    venue: body.venue,
    startTime,
    createdById: access.session.userId,
    teamAId,
    teamBId,
    visibility: body.visibility?.trim() || "PUBLIC",
    scoringMode: body.scoringMode?.trim() || "LIVE",
    status: "DRAFT",
  });

  return NextResponse.json({ success: true, data: hostedMatch }, { status: 201 });
}
