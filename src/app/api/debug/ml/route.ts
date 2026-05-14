import { NextResponse } from "next/server";
import { getActivePredictionModelVersion } from "@/services/ml/prediction/winProbabilityPredictor";
import { getPredictionMetrics } from "@/services/ml/prediction/predictionMetricsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = getPredictionMetrics();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    modelVersion: getActivePredictionModelVersion(),
    requestCount: metrics.requestCount,
    avgLatencyMs: metrics.avgLatencyMs,
    cacheHitRate: metrics.cacheHitRate,
    recentRequests: metrics.recentLogs,
  });
}
