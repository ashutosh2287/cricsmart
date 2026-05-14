import type { FeaturePayload } from "@/services/ml/types";

export type PredictionSnapshot = {
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  timestamp: number;
  modelVersion: string;
  featureSchemaVersion: string;
  featurePayload: FeaturePayload;
  rawBattingProbability: number;
  battingProbability: number;
  fallbackUsed: boolean;
};

const snapshots = new Map<string, PredictionSnapshot[]>();

function snapshotKey(innings: number, over: number, ball: number): string {
  return `${innings}:${over}.${ball}`;
}

export function recordPredictionSnapshot(snapshot: PredictionSnapshot) {
  const list = snapshots.get(snapshot.matchId) ?? [];
  const key = snapshotKey(snapshot.innings, snapshot.over, snapshot.ball);

  const index = list.findIndex((item) => snapshotKey(item.innings, item.over, item.ball) === key);
  if (index >= 0) {
    list[index] = snapshot;
  } else {
    list.push(snapshot);
  }

  snapshots.set(snapshot.matchId, list);
}

export function listPredictionSnapshots(matchId: string): PredictionSnapshot[] {
  return snapshots.get(matchId) ?? [];
}

export function getPredictionSnapshotAtBall(
  matchId: string,
  innings: number,
  over: number,
  ball: number
): PredictionSnapshot | null {
  const list = snapshots.get(matchId) ?? [];
  const key = snapshotKey(innings, over, ball);
  return list.find((item) => snapshotKey(item.innings, item.over, item.ball) === key) ?? null;
}

export function reconstructPredictionFromSnapshot(
  matchId: string,
  innings: number,
  over: number,
  ball: number
): number | null {
  const snapshot = getPredictionSnapshotAtBall(matchId, innings, over, ball);
  return snapshot?.battingProbability ?? null;
}

export function clearPredictionSnapshots(matchId: string) {
  snapshots.delete(matchId);
}
