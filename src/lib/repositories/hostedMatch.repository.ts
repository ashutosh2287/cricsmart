import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { EngineBallEvent } from "@/services/matchEngine";
import { dispatchBallEvent } from "@/services/matchEngine";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getHostedMatchById, hasHostedMatchControlAccess } from "@/lib/repositories/hostedMatch.repository";
import { requireRouteAccess } from "@/services/auth/routeGuard";

const VALID_EVENT_TYPES = new Set(["RUN", "FOUR", "SIX", "WICKET", "WD", "NB", "BYE", "LB"]);

export async function POST(req: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const access = await requireRouteAccess({ req, scope: "creator" });
  if (!access.ok) return access.response;
  if (!access.session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await context.params;
  const hostedMatch = await getHostedMatchById(matchId);
  if (!hostedMatch) {
    return NextResponse.json({ success: false, error: "Hosted match not found" }, { status: 404 });
  }

  const canControl = await hasHostedMatchControlAccess(matchId, access.session.userId, access.session.role);
  if (!canControl) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!hostedMatch.teamA || !hostedMatch.teamB) {
    return NextResponse.json({ success: false, error: "Match teams not configured" }, { status: 400 });
  }

  const body = (await req.json()) as {
    type?: string;
    runs?: number;
    batsman?: string;
    nonStriker?: string;
    bowler?: string;
    dismissalKind?: "BOWLED" | "CAUGHT" | "RUN_OUT_STRIKER" | "RUN_OUT_NON_STRIKER";
  };

  const eventType = body.type?.trim().toUpperCase();
  if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ success: false, error: "Invalid scoring event type" }, { status: 400 });
  }

  const basePlayers = {
    batsman: body.batsman?.trim() || hostedMatch.teamA.name,
    nonStriker: body.nonStriker?.trim() || `${hostedMatch.teamA.name} Partner`,
    bowler: body.bowler?.trim() || `${hostedMatch.teamB.name} Bowler`,
    battingTeam: hostedMatch.teamA.name,
    bowlingTeam: hostedMatch.teamB.name,
  };

  let event: EngineBallEvent;
  switch (eventType) {
    case "RUN":
      event = { type: "RUN", runs: Math.max(0, Math.min(6, Math.floor(body.runs ?? 0))), ...basePlayers };
      break;
    case "FOUR":
      event = { type: "FOUR", runs: 4, ...basePlayers };
      break;
    case "SIX":
      event = { type: "SIX", runs: 6, ...basePlayers };
      break;
    case "WICKET":
      event = { type: "WICKET", dismissalKind: body.dismissalKind, ...basePlayers };
      break;
    case "WD":
      event = { type: "WD", runs: Math.max(1, Math.floor(body.runs ?? 1)), ...basePlayers };
      break;
    case "NB":
      event = { type: "NB", runs: Math.max(1, Math.floor(body.runs ?? 1)), ...basePlayers };
      break;
    case "BYE":
      event = { type: "BYE", runs: Math.max(1, Math.floor(body.runs ?? 1)), ...basePlayers };
      break;
    case "LB":
      event = { type: "LB", runs: Math.max(1, Math.floor(body.runs ?? 1)), ...basePlayers };
      break;
    default:
      return NextResponse.json({ success: false, error: "Unsupported event" }, { status: 400 });
  }

  event.id = randomUUID();
  event.eventSource = "MANUAL";
  event.timestamp = Date.now();

  const result = dispatchBallEvent(hostedMatch.slug, event);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
  }

  const storage = new RedisSimulationStorage();
  await storage.save(hostedMatch.slug, result.state, {
    isRunning: true,
    isPaused: false,
    speed: 1,
  });

  return NextResponse.json({ success: true, data: result.state });
}