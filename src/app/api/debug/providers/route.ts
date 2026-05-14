import { NextResponse } from "next/server";
import { getProviderMode } from "@/config/providerMode";
import {
  getActivePollerCount,
  listPollingHealth,
} from "@/services/providers/polling/pollingRegistry";
import { listClientCounts } from "@/services/realtime/clientStore";
import { listMatchRegistry } from "@/services/match/matchRegistry";
import { getPollingLimits } from "@/services/providers/polling/pollingStrategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providerMode = getProviderMode();
  const polling = listPollingHealth();
  const viewers = listClientCounts();
  const matches = await listMatchRegistry();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    providerMode,
    limits: getPollingLimits(),
    activePollers: getActivePollerCount(),
    activeLiveSessions: matches.filter((m) => m.status === "LIVE").length,
    polling,
    viewers,
    sessions: matches.map((m) => ({
      matchId: m.matchId,
      status: m.status,
      type: m.type,
      isLiveConnected: m.isLiveConnected,
      heartbeatFresh: m.heartbeatFresh,
      lastHeartbeatAt: m.lastHeartbeatAt,
    })),
  });
}
