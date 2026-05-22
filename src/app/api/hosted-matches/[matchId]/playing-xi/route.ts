import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hasHostedMatchControlAccess } from "@/lib/repositories/hostedMatch.repository";
import { getRedis } from "@/services/storage/redisClient";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

const schema = z.object({
  teamAXI: z.array(z.string()).length(11),
  teamBXI: z.array(z.string()).length(11),
});

type PlayerDTO = {
  id: string;
  name: string;
  jerseyNo: number | null;
  role: string;
};

function getPlayingXIKey(matchId: string) {
  return `match:${matchId}:playing-xi`;
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getRequiredRequestAuthSession("/hosted-matches");
    const { matchId } = await context.params;

    const canControl = await hasHostedMatchControlAccess(matchId, session.userId, session.role);
    if (!canControl) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Select exactly 11 players per team" }, { status: 400 });
    }

    if (uniqueIds(parsed.data.teamAXI).length !== 11 || uniqueIds(parsed.data.teamBXI).length !== 11) {
      return NextResponse.json({ success: false, error: "Duplicate players are not allowed" }, { status: 400 });
    }

    const match = await prisma.hostedMatch.findUnique({
      where: { id: matchId },
      select: { id: true, teamAId: true, teamBId: true },
    });
    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const allIds = [...parsed.data.teamAXI, ...parsed.data.teamBXI];
    const players = await prisma.teamMember.findMany({
      where: {
        id: { in: allIds },
        userId: null,
      },
      select: {
        id: true,
        teamId: true,
      },
    });

    const teamASet = new Set(players.filter((p) => p.teamId === match.teamAId).map((p) => p.id));
    const teamBSet = new Set(players.filter((p) => p.teamId === match.teamBId).map((p) => p.id));

    const invalidTeamA = parsed.data.teamAXI.some((id) => !teamASet.has(id));
    const invalidTeamB = parsed.data.teamBXI.some((id) => !teamBSet.has(id));

    if (invalidTeamA || invalidTeamB) {
      return NextResponse.json({ success: false, error: "Playing XI must be selected from each team's squad" }, { status: 400 });
    }

    const redis = getRedis();
    await redis.set(
      getPlayingXIKey(matchId),
      JSON.stringify({ teamAXI: parsed.data.teamAXI, teamBXI: parsed.data.teamBXI }),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save playing XI" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;
    const redis = getRedis();
    const raw = await redis.get(getPlayingXIKey(matchId));

    if (!raw) {
      return NextResponse.json({ success: false, error: "Playing XI not set" }, { status: 404 });
    }

    const stored = schema.parse(JSON.parse(raw));

    const match = await prisma.hostedMatch.findUnique({
      where: { id: matchId },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const allIds = [...stored.teamAXI, ...stored.teamBXI];
    const players = await prisma.teamMember.findMany({
      where: {
        id: { in: allIds },
        userId: null,
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        jerseyNo: true,
        playerRole: true,
      },
    });

    const playerMap = new Map(players.map((player) => [player.id, player]));

    const teamAXI: PlayerDTO[] = stored.teamAXI
      .map((id) => playerMap.get(id))
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map((player) => ({
        id: player.id,
        name: player.name ?? "Unknown Player",
        jerseyNo: player.jerseyNo,
        role: player.playerRole ?? "PLAYER",
      }));

    const teamBXI: PlayerDTO[] = stored.teamBXI
      .map((id) => playerMap.get(id))
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map((player) => ({
        id: player.id,
        name: player.name ?? "Unknown Player",
        jerseyNo: player.jerseyNo,
        role: player.playerRole ?? "PLAYER",
      }));

    const battingFirstId =
      match.battingFirstId ??
      (match.tossWinnerId
        ? match.tossDecision === "BAT"
          ? match.tossWinnerId
          : match.tossWinnerId === match.teamAId
            ? match.teamBId
            : match.teamAId
        : match.teamAId);

    const battingTeam = battingFirstId === match.teamAId ? teamAXI : teamBXI;
    const bowlingTeam = battingFirstId === match.teamAId ? teamBXI : teamAXI;

    return NextResponse.json({
      success: true,
      playingXI: {
        teamAXI,
        teamBXI,
        battingTeam,
        bowlingTeam,
        battingTeamName: battingFirstId === match.teamAId ? match.teamA.name : match.teamB.name,
        bowlingTeamName: battingFirstId === match.teamAId ? match.teamB.name : match.teamA.name,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load playing XI" }, { status: 500 });
  }
}
