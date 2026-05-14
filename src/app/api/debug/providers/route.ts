import { NextResponse } from "next/server";
import { getProviderMode } from "@/config/providerMode";
import {
  getActivePollerCount,
  getQuotaSummary,
  listPollingHealth,
} from "@/services/providers/polling/pollingRegistry";
import { listClientCounts } from "@/services/realtime/clientStore";
import { listMatchRegistry } from "@/services/match/matchRegistry";
import { getPollingLimits } from "@/services/providers/polling/pollingStrategy";
import { getSnapshotResilienceMetrics } from "@/services/runtime/snapshotCache";
import { getSessionRecoveryDiagnostics } from "@/services/runtime/sessionRecovery";
import { ensureSessionRecoveryStarted } from "@/services/runtime/sessionRecoveryBootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  ensureSessionRecoveryStarted();

  const providerMode = getProviderMode();
  const polling = listPollingHealth();
  const viewers = listClientCounts();
  const matches = await listMatchRegistry();
  const quota = getQuotaSummary();
  const snapshot = getSnapshotResilienceMetrics();
  const recovery = getSessionRecoveryDiagnostics();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    providerMode,
    limits: getPollingLimits(),
    activePollers: getActivePollerCount(),
    activeLiveSessions: matches.filter((m) => m.status === "LIVE").length,
    quota,
    snapshot,
    recovery,
    polling,
    viewers,
    sessions: matches.map((m) => ({
      matchId: m.matchId,
      status: m.status,
      type: m.type,
      sourceType: m.sourceType,
      isLiveConnected: m.isLiveConnected,
      heartbeatFresh: m.heartbeatFresh,
      lastHeartbeatAt: m.lastHeartbeatAt,
    })),
  });
}
