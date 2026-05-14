import { NextResponse } from "next/server";
import { listMatchRegistry, type MatchRegistryRecord } from "@/services/match/matchRegistry";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getCommentary } from "@/services/commentary/commentaryStore";
import { isLiveMatchIngestorRunning } from "@/services/ingestion/liveMatchIngestor";
import { isWorkerRunning } from "@/services/queue/eventWorker";

type MatchListRow = MatchRegistryRecord & {
  heartbeatFresh: boolean;
};

function withDerivedFreshness(match: MatchRegistryRecord): MatchListRow {
  const now = Date.now();
  const heartbeatTs = match.lastHeartbeatAt ?? 0;
  const heartbeatFresh = now - heartbeatTs <= 20_000;
  const ingestionRunning = match.type === "LIVE" ? isLiveMatchIngestorRunning(match.matchId) : false;
  const workerRunning = match.type === "LIVE" ? isWorkerRunning(match.matchId) : false;
  let liveSessionStatus = match.liveSessionStatus;

  if (match.type === "LIVE") {
    if (ingestionRunning && workerRunning) {
      liveSessionStatus = "live";
    } else if (match.status === "LIVE") {
      liveSessionStatus = "degraded";
    } else {
      liveSessionStatus = "stopped";
    }
  }

  return {
    ...match,
    heartbeatFresh,
    ingestionRunning,
    workerRunning,
    liveSessionStatus,
    reconnectHealth:
      match.status === "LIVE"
        ? heartbeatFresh
          ? "healthy"
          : "stale"
        : match.reconnectHealth,
  };
}

export async function GET() {
  try {
    const storage = new RedisSimulationStorage();
    const base = await listMatchRegistry();

    const rows = await Promise.all(
      base.map(async (record) => {
        const loaded = await storage.load(record.matchId);
        const state = loaded?.state;
        const innings = state?.innings?.[state.currentInningsIndex ?? 0];

        const currentRuns = innings?.runs ?? record.currentRuns;
        const currentWickets = innings?.wickets ?? record.currentWickets;
        const currentOver = innings?.over ?? record.currentOver;
        const currentBall = innings?.ball ?? record.currentBall;
        const score =
          currentRuns !== undefined && currentWickets !== undefined
            ? `${currentRuns}/${currentWickets}`
            : record.score;
        const overDisplay =
          currentOver !== undefined && currentBall !== undefined
            ? `${currentOver}.${currentBall}`
            : record.overDisplay;

        const commentary = getCommentary(record.matchId);
        const latestEntry: unknown = commentary.length > 0 ? commentary[commentary.length - 1] : undefined;
        const commentaryPreview =
          typeof latestEntry === "string"
            ? latestEntry
            : typeof latestEntry === "object" && latestEntry !== null && "text" in latestEntry && typeof (latestEntry as { text?: unknown }).text === "string"
              ? (latestEntry as { text: string }).text
              : record.commentaryPreview;

        return withDerivedFreshness({
          ...record,
          currentRuns,
          currentWickets,
          currentOver,
          currentBall,
          score,
          overDisplay,
          commentaryPreview,
          lastUpdateAt: loaded?.updatedAt ?? record.lastUpdateAt,
        });
      })
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Failed to list matches", error);
    return NextResponse.json([], { status: 200 });
  }
}
