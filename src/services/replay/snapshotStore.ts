import { MatchState } from "@/services/matchEngine";

type Snapshot = {
  index: number;
  state: MatchState;
};

const snapshotDB: Record<string, Snapshot[]> = {};

const SNAPSHOT_INTERVAL = 6; // every over

export function saveSnapshot(
  matchId: string,
  index: number,
  state: MatchState
) {
  if (index % SNAPSHOT_INTERVAL !== 0) return;

  if (!snapshotDB[matchId]) {
    snapshotDB[matchId] = [];
  }

  snapshotDB[matchId].push({
    index,
    state: structuredClone(state), // deep copy
  });
}

export function getNearestSnapshot(matchId: string, targetIndex: number) {
  const snapshots = snapshotDB[matchId] || [];

  let best: Snapshot | null = null;

  for (const snap of snapshots) {
    if (snap.index <= targetIndex) {
      best = snap;
    } else {
      break;
    }
  }

  return best;
}

export function clearSnapshots(matchId: string) {
  delete snapshotDB[matchId];
}