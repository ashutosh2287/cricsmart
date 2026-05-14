import { logger } from "@/lib/logger";
import {
  getCalibrationManifest,
  type CalibrationManifest,
} from "@/services/ml/calibration/calibrationManifest";
import { markCalibrationLoaded } from "@/services/ml/observability/mlObservabilityStore";

const INTERPOLATION_EPSILON = 1e-9;

function clampProbability(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function toUnitProbability(value: number): number {
  return clampProbability(value) / 100;
}

function fromUnitProbability(value: number): number {
  return clampProbability(value * 100);
}

function applyIsotonic(p: number, manifest: CalibrationManifest): number {
  if (manifest.strategy.type !== "isotonic" || manifest.strategy.points.length === 0) {
    return p;
  }

  const sorted = [...manifest.strategy.points].sort((a, b) => a.input - b.input);
  if (p <= sorted[0].input) return sorted[0].output;

  const last = sorted[sorted.length - 1];
  if (p >= last.input) return last.output;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (p <= next.input) {
      const ratio = (p - prev.input) / Math.max(next.input - prev.input, INTERPOLATION_EPSILON);
      return prev.output + ratio * (next.output - prev.output);
    }
  }

  return p;
}

export function calibrateProbability(rawBattingProbability: number): number {
  const manifest = getCalibrationManifest();

  markCalibrationLoaded(manifest.modelVersion, manifest.featureSchemaVersion);

  const unit = toUnitProbability(rawBattingProbability);

  if (manifest.strategy.type === "identity") {
    return clampProbability(rawBattingProbability);
  }

  if (manifest.strategy.type === "platt") {
    const z = manifest.strategy.a * unit + manifest.strategy.b;
    const calibrated = 1 / (1 + Math.exp(-z));
    return fromUnitProbability(calibrated);
  }

  const isotonic = applyIsotonic(unit, manifest);
  const result = fromUnitProbability(isotonic);

  logger.debug("ML", "calibration_loaded", {
    modelVersion: manifest.modelVersion,
    schemaVersion: manifest.featureSchemaVersion,
    strategy: manifest.strategy.type,
  });

  return result;
}
