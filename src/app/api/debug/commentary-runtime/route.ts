import { NextResponse } from "next/server";
import { getCommentaryRuntimeFlags } from "@/services/ml/commentary/commentary-runtime-flags";
import { getRuntimeFeatureContract, getRuntimeThresholds, validateRuntimeContract } from "@/services/ml/commentary/commentary-runtime-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const contract = getRuntimeFeatureContract();
  const validation = validateRuntimeContract();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    runtimeFlags: getCommentaryRuntimeFlags(),
    thresholds: getRuntimeThresholds(),
    contract: {
      schemaVersion: contract.schemaVersion,
      schemaHash: contract.schemaHash,
      classifierFeatureCount: contract.classifierFeatures.length,
      rankerFeatureCount: contract.rankerFeatures.length,
      targetColumns: contract.targetColumns,
      labelMappings: contract.labelMappings,
    },
    contractValidation: validation,
  });
}
