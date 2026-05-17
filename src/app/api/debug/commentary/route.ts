import { NextResponse } from "next/server";
import { getCommentaryInferenceStats } from "@/services/commentary/commentaryInferenceClient";
import { getCommentaryContextSnapshots } from "@/services/commentary/commentaryContextSnapshotStore";
import { getLatestCommentaryIntelligence } from "@/services/commentary/commentaryIntelligenceStore";
import { getMatchStoryState } from "@/services/commentary/commentaryMatchStoryEngine";
import { getCommentarySummaries } from "@/services/commentary/commentarySummaryEngine";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export async function GET(request: Request) {
  const access = await requireRouteAccess({ req: request, scope: "internal" });
  if (!access.ok) return access.response;

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId") ?? "";
  const snapshots = matchId ? getCommentaryContextSnapshots(matchId) : [];
  const latestIntelligence = matchId ? getLatestCommentaryIntelligence(matchId) : null;
  const story = matchId ? getMatchStoryState(matchId) : null;
  const summaries = matchId ? getCommentarySummaries(matchId) : [];

  return NextResponse.json({
    ...getCommentaryInferenceStats(),
    matchId: matchId || null,
    contextSnapshotCount: snapshots.length,
    latestContextSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
    activeTone: latestIntelligence?.metadata.tone ?? null,
    narrativeState: latestIntelligence?.metadata.narrativeState ?? [],
    generationStrategy: latestIntelligence?.metadata.strategy ?? null,
    runtimeMode: latestIntelligence?.metadata.runtimeMode ?? null,
    fallbackUsed: latestIntelligence?.metadata.safety.usedFallback ?? false,
    fallbackReason: latestIntelligence?.metadata.safety.fallbackReason ?? null,
    latestLatencyMs: latestIntelligence?.metadata.latencyMs ?? null,
    latestCacheHit: latestIntelligence?.metadata.cacheHit ?? null,
    activeStoryline: story?.activeStoryline ?? null,
    storyTransitions: story?.history ?? [],
    summaryCount: summaries.length,
    latestSummary: summaries.length > 0 ? summaries[summaries.length - 1] : null,
  });
}
