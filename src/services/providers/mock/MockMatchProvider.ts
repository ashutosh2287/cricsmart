import { logger } from "@/lib/logger";
import type { ApiBallEvent } from "@/services/api/cricketApiService";
import { getMockFixtures } from "@/services/providers/mock/mockFixtures";
import { getMockBallEvents } from "@/services/providers/mock/mockBallEvents";
import { getMockMatchState } from "@/services/providers/mock/mockMatchStates";
import type { MatchProvider } from "@/services/providers/types";

type ReplayMode = "paced" | "instant" | "over";

type MockReplayCursor = {
  index: number;
  lastReleaseAt: number;
};

const cursors = new Map<string, MockReplayCursor>();

function getReplayMode(): ReplayMode {
  const raw = (process.env.MOCK_REPLAY_MODE ?? "paced").trim().toLowerCase();
  if (raw === "instant") return "instant";
  if (raw === "over" || raw === "over-by-over") return "over";
  return "paced";
}

function getSpeedMs() {
  const parsed = Number(process.env.MOCK_REPLAY_SPEED_MS ?? 1200);
  if (!Number.isFinite(parsed) || parsed < 100) return 1200;
  return parsed;
}

function getBatchSize(): number {
  const parsed = Number(process.env.MOCK_REPLAY_BATCH_SIZE ?? 1);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(12, Math.floor(parsed));
}

function getCursor(externalMatchId: string): MockReplayCursor {
  const found = cursors.get(externalMatchId);
  if (found) return found;

  const created: MockReplayCursor = {
    index: 0,
    lastReleaseAt: 0,
  };
  cursors.set(externalMatchId, created);
  return created;
}

function nextOverBoundary(events: ApiBallEvent[], startIndex: number): number {
  const first = events[startIndex];
  if (!first) return startIndex;

  let i = startIndex;
  while (i < events.length) {
    const current = events[i];
    if (!current || current.over !== first.over || current.innings !== first.innings) {
      break;
    }
    i += 1;
  }

  return i;
}

function consumeMockEvents(externalMatchId: string): ApiBallEvent[] {
  const events = getMockBallEvents(externalMatchId);
  if (!events.length) return [];

  const cursor = getCursor(externalMatchId);
  const mode = getReplayMode();

  if (cursor.index >= events.length) {
    return [];
  }

  if (mode === "instant") {
    const remaining = events.slice(cursor.index);
    cursor.index = events.length;
    return remaining;
  }

  const now = Date.now();
  if (mode === "paced") {
    const speed = getSpeedMs();
    if (cursor.lastReleaseAt && now - cursor.lastReleaseAt < speed) {
      return [];
    }

    const end = Math.min(events.length, cursor.index + getBatchSize());
    const batch = events.slice(cursor.index, end);
    cursor.index = end;
    cursor.lastReleaseAt = now;
    return batch;
  }

  const end = nextOverBoundary(events, cursor.index);
  const batch = events.slice(cursor.index, end);
  cursor.index = end;
  cursor.lastReleaseAt = now;
  return batch;
}

export const mockMatchProvider: MatchProvider = {
  name: "mock",
  mode: "mock",
  supportsLivePolling: false,
  getFixtures: async () => getMockFixtures(),
  getMatchState: async (externalMatchId) => getMockMatchState(externalMatchId),
  pollMatchEvents: async (externalMatchId) => {
    const batch = consumeMockEvents(externalMatchId);
    if (batch.length > 0) {
      logger.info("PROVIDER", "provider_poll_success", {
        provider: "mock",
        externalMatchId,
        emitted: batch.length,
      });
    }
    return batch;
  },
};
