export type BenchmarkModel = "xgboost" | "lightgbm" | "catboost";

export type BenchmarkReport = {
  model: BenchmarkModel;
  modelVersion: string;
  featureSchemaVersion: string;
  generatedAt: string;
  metrics: {
    accuracy: number;
    calibration: number;
    latencyMs: number;
    stability: number;
    replayReconstructionQuality: number;
  };
};

const benchmarkStore: BenchmarkReport[] = [];

export function persistBenchmarkReport(report: BenchmarkReport) {
  benchmarkStore.push(report);
}

export function listBenchmarkReports(): BenchmarkReport[] {
  return [...benchmarkStore];
}
