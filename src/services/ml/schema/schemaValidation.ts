import { logger } from "@/lib/logger";
import type { FeaturePayload } from "@/services/ml/types";
import { getFeatureContract } from "@/services/ml/schema/featureContracts";
import { markSchemaMismatch } from "@/services/ml/observability/mlObservabilityStore";

export class SchemaMismatchError extends Error {
  constructor(
    message: string,
    public readonly details: {
      schemaVersion: string;
      missingFeatures: string[];
      nonNumericFeatures: string[];
    }
  ) {
    super(message);
    this.name = "SchemaMismatchError";
  }
}

export function validateFeaturePayloadCompatibility(
  schemaVersion: string,
  payload: FeaturePayload
): void {
  const contract = getFeatureContract(schemaVersion);
  if (!contract) {
    markSchemaMismatch();
    logger.warn("ML", "schema_mismatch", {
      schemaVersion,
      reason: "unknown_schema_version",
    });
    throw new SchemaMismatchError("Unknown feature schema version", {
      schemaVersion,
      missingFeatures: [],
      nonNumericFeatures: [],
    });
  }

  const missingFeatures = contract.featureNames.filter((name) => !(name in payload));
  const nonNumericFeatures = contract.featureNames.filter((name) => {
    const value = payload[name];
    return !Number.isFinite(value);
  });

  if (missingFeatures.length || nonNumericFeatures.length) {
    markSchemaMismatch();
    logger.warn("ML", "schema_mismatch", {
      schemaVersion,
      missingFeatures,
      nonNumericFeatures,
    });
    throw new SchemaMismatchError("Incompatible feature payload", {
      schemaVersion,
      missingFeatures,
      nonNumericFeatures,
    });
  }
}
