export type CalibrationStrategy =
  | { type: "identity" }
  | { type: "platt"; a: number; b: number }
  | {
      type: "isotonic";
      points: Array<{
        input: number;
        output: number;
      }>;
    };

export type CalibrationManifest = {
  modelVersion: string;
  featureSchemaVersion: string;
  strategy: CalibrationStrategy;
  metrics: {
    brierScore: number;
    reliabilityError: number;
    confidenceStability: number;
  };
  generatedAt: string;
};

const DEFAULT_CALIBRATION_MANIFEST: CalibrationManifest = {
  modelVersion: "legacy-winprob-wrapper.v1",
  featureSchemaVersion: "win-probability.v1",
  strategy: { type: "identity" },
  metrics: {
    brierScore: 0,
    reliabilityError: 0,
    confidenceStability: 0,
  },
  generatedAt: new Date(0).toISOString(),
};

let activeManifest: CalibrationManifest = DEFAULT_CALIBRATION_MANIFEST;

export function getCalibrationManifest(): CalibrationManifest {
  return activeManifest;
}

export function loadCalibrationManifest(manifest: CalibrationManifest) {
  activeManifest = manifest;
}
