import { NextResponse } from "next/server";
import { getCommentaryInferenceStats } from "@/services/commentary/commentaryInferenceClient";
import { getCommentaryContextSnapshots } from "@/services/commentary/commentaryContextBuilder";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId") ?? "";
  const snapshots = matchId ? getCommentaryContextSnapshots(matchId) : [];

  return NextResponse.json({
    ...getCommentaryInferenceStats(),
    matchId: matchId || null,
    contextSnapshotCount: snapshots.length,
    latestContextSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
  });
}
