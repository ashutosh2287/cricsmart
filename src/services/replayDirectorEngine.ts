// src/services/replayDirectorEngine.ts

import { subscribeDirectorSignal } from "./directorSignalBus";
import { emitBroadcastCommand } from "./broadcastCommands";
import { DirectorSignal } from "./directorSignals";
import { detectTurningPoints } from "./analytics/turningPointEngine";
import { getMomentumSwings } from "./analytics/momentumSwingEngine";

/**
 * 🔹 Dynamic storage loader (prevents Redis from entering client bundle)
 */
type StorageModuleType = typeof import("@/services/storage/eventStorage");

let storageModule: StorageModuleType | null = null;

async function getStorageModule(): Promise<StorageModuleType> {
  if (!storageModule) {
    storageModule = await import("@/services/storage/eventStorage");
  }
  return storageModule;
}

/**
 * 🔹 Director Engine Init
 */
export function initReplayDirectorEngine() {
  subscribeDirectorSignal((signal: DirectorSignal) => {
    switch (signal.type) {
      case "HIGHLIGHT_DETECTED":
        if (signal.subtype === "SIX" || signal.subtype === "WICKET") {
          emitBroadcastCommand({
            type: "PLAY_SLOW_MOTION",
            slug: signal.eventId,
          });
        }
        break;

      case "COLLAPSE_ALERT":
        emitBroadcastCommand({
          type: "PLAY_SLOW_MOTION",
          slug: signal.eventId,
        });
        break;

      case "PRESSURE_SPIKE":
        emitBroadcastCommand({
          type: "CAMERA_SWEEP",
          slug: signal.eventId,
        });
        break;
    }
  });
}

/*
========================================
REPLAY SEQUENCE ENGINE
========================================
*/

export type ReplaySegment = {
  ballIndex: number;
  type:
    | "WICKET_REPLAY"
    | "BOUNDARY_REPLAY"
    | "MOMENTUM_SHIFT"
    | "TURNING_POINT";
  priority: number;
};

const replayQueue: Record<string, ReplaySegment[]> = {};

export function getReplayQueue(matchId: string) {
  return replayQueue[matchId] ?? [];
}

export async function generateReplaySequence(matchId: string) {
  const { getMatchEvents } = await getStorageModule();
  const events = await getMatchEvents(matchId);

  if (!events.length) return;

  const queue: ReplaySegment[] = [];

  const turningPoints = detectTurningPoints(events);
  const swings = getMomentumSwings(matchId);

  /*
  ========================================
  Turning Points
  ========================================
  */
  turningPoints.forEach((tp) => {
    if (tp.type === "WICKET") {
      queue.push({
        ballIndex: tp.ballIndex,
        type: "WICKET_REPLAY",
        priority: 10,
      });
    }

    if (tp.type === "BOUNDARY_BURST") {
      queue.push({
        ballIndex: tp.ballIndex,
        type: "BOUNDARY_REPLAY",
        priority: 6,
      });
    }
  });

  /*
  ========================================
  Momentum Swings
  ========================================
  */
  swings.forEach((s) => {
    if (s.impact >= 0.8) {
      queue.push({
        ballIndex: s.ballIndex,
        type: "MOMENTUM_SHIFT",
        priority: 8,
      });
    }
  });

  /*
  ========================================
  Priority Sort
  ========================================
  */
  queue.sort((a, b) => b.priority - a.priority);

  replayQueue[matchId] = queue;
}