import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { EngineBallEvent } from "@/services/matchEngine";
import { dispatchBallEvent } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getRedis } from "@/services/storage/redisClient";
import { prisma } from "@/lib/db/prisma";
import { hasHostedMatchControlAccess } from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

const EVENT_MAP: Record<string, "RUN" | "WD" | "NB" | "BYE" | "LB" | "WICKET"> = {
  RUN: "RUN",
  WIDE: "WD",
  WD: "WD",
  NO_BALL: "NB",
  NB: "NB",
  BYE: "BYE",
  LEG_BYE: "LB",
  LB: "LB",
  WICKET: "WICKET",
};

function getPlayingXIKey(hostedMatchId: string) {
  return `match:${hostedMatchId}:playing-xi`;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await context.params;

  const body = (await req.json()) as {
    eventType?: string;
    runs?: number;
    strikerId?: string;
    nonStrikerId?: string;
    bowlerId?: string;
    hostedMatchId?: string;
  };

  const hostedMatch = body.hostedMatchId
    ? await prisma.hostedMatch.findFirst({
        where: { id: body.hostedMatchId, runtimeMatchId: matchId },
        select: {
          id: true,
          teamAId: true,
          teamBId: true,
          battingFirstId: true,
          tossWinnerId: true,
          tossDecision: true,
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
        },
      })
    : await prisma.hostedMatch.findFirst({
        where: { runtimeMatchId: matchId },
        select: {
          id: true,
          teamAId: true,
          teamBId: true,
          battingFirstId: true,
          tossWinnerId: true,
          tossDecision: true,
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
        },
      });

  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  const canControl = await hasHostedMatchControlAccess(hostedMatch.id, access.session.userId, access.session.role);
  if (!canControl) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const normalizedEventType = EVENT_MAP[(body.eventType ?? "").trim().toUpperCase()];
  if (!normalizedEventType) {
    return NextResponse.json({ success: false, error: "Invalid scoring event type" }, { status: 400 });
  }

  const strikerId = body.strikerId?.trim();
  const nonStrikerId = body.nonStrikerId?.trim();
  const bowlerId = body.bowlerId?.trim();
  if (!strikerId || !nonStrikerId || !bowlerId) {
    return NextResponse.json({ success: false, error: "Select striker, non-striker and bowler" }, { status: 400 });
  }

  const redis = getRedis();
  const raw = await redis.get(getPlayingXIKey(hostedMatch.id));
  if (!raw) {
    return NextResponse.json({ success: false, error: "Playing XI not set" }, { status: 400 });
  }

  const parsed = JSON.parse(raw) as { teamAXI?: string[]; teamBXI?: string[] };
  const teamAXI = Array.isArray(parsed.teamAXI) ? parsed.teamAXI : [];
  const teamBXI = Array.isArray(parsed.teamBXI) ? parsed.teamBXI : [];

  const firstBattingTeamId =
    hostedMatch.battingFirstId ??
    (hostedMatch.tossWinnerId
      ? hostedMatch.tossDecision === "BAT"
        ? hostedMatch.tossWinnerId
        : hostedMatch.tossWinnerId === hostedMatch.teamAId
          ? hostedMatch.teamBId
          : hostedMatch.teamAId
      : hostedMatch.teamAId);

  const storage = new RedisSimulationStorage();
  const runtime = await storage.load(matchId);
  const isSecondInnings = (runtime?.state.currentInningsIndex ?? 0) === 1;

  const battingTeamId = isSecondInnings
    ? firstBattingTeamId === hostedMatch.teamAId
      ? hostedMatch.teamBId
      : hostedMatch.teamAId
    : firstBattingTeamId;

  const battingXI = battingTeamId === hostedMatch.teamAId ? teamAXI : teamBXI;
  const bowlingXI = battingTeamId === hostedMatch.teamAId ? teamBXI : teamAXI;

  if (!battingXI.includes(strikerId) || !battingXI.includes(nonStrikerId)) {
    return NextResponse.json({ success: false, error: "Striker and non-striker must belong to the batting XI" }, { status: 400 });
  }

  if (!bowlingXI.includes(bowlerId)) {
    return NextResponse.json({ success: false, error: "Bowler must belong to the bowling XI" }, { status: 400 });
  }

  const playerRows = await prisma.teamMember.findMany({
    where: {
      id: { in: [strikerId, nonStrikerId, bowlerId] },
      userId: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const playerMap = new Map(playerRows.map((player) => [player.id, player.name ?? "Unknown Player"]));

  const striker = playerMap.get(strikerId);
  const nonStriker = playerMap.get(nonStrikerId);
  const bowler = playerMap.get(bowlerId);
  if (!striker || !nonStriker || !bowler) {
    return NextResponse.json({ success: false, error: "Selected players not found" }, { status: 400 });
  }

  const battingTeamName = battingTeamId === hostedMatch.teamAId ? hostedMatch.teamA.name : hostedMatch.teamB.name;
  const bowlingTeamName = battingTeamId === hostedMatch.teamAId ? hostedMatch.teamB.name : hostedMatch.teamA.name;

  const basePlayers = {
    batsman: striker,
    nonStriker,
    bowler,
    battingTeam: battingTeamName,
    bowlingTeam: bowlingTeamName,
  };

  const runs = Math.max(0, Math.min(6, Math.floor(body.runs ?? 0)));

  let event: EngineBallEvent;
  switch (normalizedEventType) {
    case "RUN":
      event = { type: "RUN", runs, ...basePlayers };
      break;
    case "WD":
      event = { type: "WD", runs: Math.max(1, runs || 1), ...basePlayers };
      break;
    case "NB":
      event = { type: "NB", runs: Math.max(1, runs || 1), ...basePlayers };
      break;
    case "BYE":
      event = { type: "BYE", runs, ...basePlayers };
      break;
    case "LB":
      event = { type: "LB", runs, ...basePlayers };
      break;
    case "WICKET":
      event = { type: "WICKET", ...basePlayers };
      break;
  }

  event.id = randomUUID();
  event.eventSource = "MANUAL";
  event.timestamp = Date.now();

  const result = dispatchBallEvent(matchId, event);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
  }

  await storage.save(matchId, result.state, {
    isRunning: true,
    isPaused: false,
    speed: 1,
  });

  return NextResponse.json({ success: true, data: result.state });
}
