import { ApiBallEvent } from "../api/cricketApiService";
import { smartReconcileMatch } from "../reconciliation/smartReconciler";
import { fetchWithRetry } from "../api/reliableFetch";
import { pushEvents, flushEvents } from "./eventBuffer";
import { isMatchActive } from "../match/matchManager";
import { redis } from "../queue/redisClient";
import { registerPlayer } from "../player/playerRegistry";
import { getMatchState, syncBattingOrder } from "../matchEngine";
import {
  markMatchDisconnected,
  touchMatchHeartbeat,
} from "@/services/match/matchRegistry";
import { getProviderMode } from "@/config/providerMode";
import { getMatchProvider } from "@/services/providers/providerFactory";
import {
  hasPollingSession,
  startPollingSession,
  stopPollingSession,
} from "@/services/providers/polling/pollingController";
import { getPollingHealth } from "@/services/providers/polling/pollingRegistry";
import { getClientCount } from "@/services/realtime/clientStore";
import { getReplayState } from "@/services/replay/replayEngine";
import { logger } from "@/lib/logger";

type MatchRuntime = {
  abortController: AbortController;
  processedEvents: Set<string>;
  lastProcessedPointer?: string;
  pollCount: number;
  isReconciling: boolean;
  isFetching: boolean;
  failureCount: number;
  backoffUntil: number;
};

const runtimes = new Map<string, MatchRuntime>();

const MAX_EVENT_CACHE = 300;
const MAX_EVENT_BATCH = 50;
const RECONCILE_POLL_FREQUENCY = 3;

function buildEventKey(apiEvent: ApiBallEvent) {
  if (apiEvent.id) return apiEvent.id;
  return `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}-${apiEvent.runs}-${apiEvent.type}-w${apiEvent.wicket ? 1 : 0}`;
}

function buildPointer(apiEvent: ApiBallEvent) {
  return `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}`;
}

function pointerToTuple(pointer: string): [number, number, number] {
  const [innings, over, ball] = pointer.split("-").map(Number);
  return [innings || 0, over || 0, ball || 0];
}

function comparePointers(a: string, b: string): number {
  const [aInn, aOver, aBall] = pointerToTuple(a);
  const [bInn, bOver, bBall] = pointerToTuple(b);

  if (aInn !== bInn) return aInn - bInn;
  if (aOver !== bOver) return aOver - bOver;
  return aBall - bBall;
}

function isValidIncomingEvent(event: ApiBallEvent): boolean {
  if (!event) return false;
  if (!Number.isFinite(event.innings) || event.innings < 0) return false;
  if (!Number.isFinite(event.over) || event.over < 0) return false;
  if (!Number.isFinite(event.ball) || event.ball < 0) return false;
  if (!Number.isFinite(event.runs) || event.runs < 0) return false;
  if (!event.type) return false;
  return true;
}

function getOrCreateRuntime(matchId: string): MatchRuntime {
  const existing = runtimes.get(matchId);
  if (existing) return existing;

  const created: MatchRuntime = {
    abortController: new AbortController(),
    processedEvents: new Set<string>(),
    pollCount: 0,
    isReconciling: false,
    isFetching: false,
    failureCount: 0,
    backoffUntil: 0,
  };
  runtimes.set(matchId, created);
  return created;
}

async function pollAndIngest(matchId: string, externalMatchId: string) {
  const providerMode = getProviderMode();
  const provider = getMatchProvider(providerMode);
  const runtime = getOrCreateRuntime(matchId);

  if (Date.now() < runtime.backoffUntil) return;

  runtime.pollCount += 1;

  if (!isMatchActive(matchId)) {
    stopLiveMatchIngestor(matchId);
    await markMatchDisconnected(matchId);
    return;
  }

  if (runtime.isFetching || runtime.isReconciling) {
    return;
  }

  const replay = getReplayState(matchId);
  if (replay.isReplayMode) {
    return;
  }

  runtime.isFetching = true;

  try {
    const state = getMatchState(matchId);
    if (!state) return;

    const innings = state.innings[state.currentInningsIndex];

    if (innings?.completed) {
      stopLiveMatchIngestor(matchId);
      await markMatchDisconnected(matchId);
      return;
    }

    let events: ApiBallEvent[] = [];

    try {
      events = await fetchWithRetry(
        (signal) => provider.pollMatchEvents(externalMatchId, signal),
        runtime.abortController.signal
      );

      runtime.failureCount = 0;
    } catch (err) {
      runtime.failureCount += 1;

      if (runtime.failureCount >= 3) {
        const delay = Math.min(15000, runtime.failureCount * 3000);
        runtime.backoffUntil = Date.now() + delay;
      }

      await markMatchDisconnected(matchId);
      logger.warn("PROVIDER", "provider_poll_failed", {
        matchId,
        provider: provider.name,
        failureCount: runtime.failureCount,
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      await touchMatchHeartbeat(matchId);
      return;
    }

    if (runtime.processedEvents.size === 0) {
      const playersSet = new Set<string>();

      events.forEach((e) => {
        if (e.batsman) playersSet.add(e.batsman);
        if (e.bowler) playersSet.add(e.bowler);
      });

      const players = Array.from(playersSet);

      players.forEach((name) => {
        registerPlayer(matchId, name, name);
      });

      if (players.length >= 2) {
        syncBattingOrder(matchId, players);
      }
    }

    pushEvents(matchId, events);
    const bufferedEvents = flushEvents(matchId);

    if (bufferedEvents.length > MAX_EVENT_BATCH) {
      bufferedEvents.splice(MAX_EVENT_BATCH);
    }

    const sortedEvents = [...bufferedEvents].sort((a, b) => {
      if (a.innings !== b.innings) return a.innings - b.innings;
      if (a.over !== b.over) return a.over - b.over;
      return a.ball - b.ball;
    });

    let latestCommentary: string | undefined;

    for (const apiEvent of sortedEvents) {
      if (!isValidIncomingEvent(apiEvent)) continue;

      const eventKey = buildEventKey(apiEvent);
      if (runtime.processedEvents.has(eventKey)) continue;

      const pointer = buildPointer(apiEvent);
      const lastPointer = runtime.lastProcessedPointer;

      if (lastPointer && comparePointers(pointer, lastPointer) <= 0) {
        continue;
      }

      await redis.lpush(`match:${matchId}:events`, JSON.stringify(apiEvent));

      runtime.lastProcessedPointer = pointer;
      runtime.processedEvents.add(eventKey);

      if (typeof apiEvent.commentary === "string" && apiEvent.commentary.trim()) {
        latestCommentary = apiEvent.commentary.trim();
      }

      if (runtime.processedEvents.size > MAX_EVENT_CACHE) {
        const first = runtime.processedEvents.values().next().value;
        if (first) runtime.processedEvents.delete(first);
      }
    }

    const latest = getMatchState(matchId);
    const latestInnings = latest?.innings[latest.currentInningsIndex];

    await touchMatchHeartbeat(matchId, {
      currentRuns: latestInnings?.runs,
      currentWickets: latestInnings?.wickets,
      currentOver: latestInnings?.over,
      currentBall: latestInnings?.ball,
      score:
        latestInnings
          ? `${latestInnings.runs ?? 0}/${latestInnings.wickets ?? 0}`
          : undefined,
      overDisplay:
        latestInnings
          ? `${latestInnings.over ?? 0}.${latestInnings.ball ?? 0}`
          : undefined,
      commentaryPreview: latestCommentary,
    });

    if (provider.supportsLivePolling && runtime.pollCount % RECONCILE_POLL_FREQUENCY === 0 && !runtime.isReconciling) {
      try {
        runtime.isReconciling = true;
        await smartReconcileMatch(
          matchId,
          externalMatchId,
          runtime.lastProcessedPointer
        );
      } finally {
        runtime.isReconciling = false;
      }
    }
  } finally {
    runtime.isFetching = false;
  }
}

export function startLiveMatchIngestor(matchId: string, externalMatchId: string) {
  if (hasPollingSession(matchId)) {
    logger.warn("PROVIDER", "provider_poll_skipped_already_running", { matchId });
    return;
  }

  const providerMode = getProviderMode();
  const provider = getMatchProvider(providerMode);

  const runtime = getOrCreateRuntime(matchId);
  runtime.abortController.abort();
  runtime.abortController = new AbortController();

  if (provider.mode === "mock") {
    logger.info("PROVIDER", "session_using_mock_provider", {
      matchId,
      externalMatchId,
    });
  }

  startPollingSession({
    matchId,
    providerName: provider.name,
    providerMode: provider.mode,
    getContext: () => {
      const state = getMatchState(matchId);
      const innings = state?.innings[state.currentInningsIndex];
      const health = getPollingHealth(matchId);

      return {
        providerMode: provider.mode,
        activeViewers: getClientCount(matchId),
        matchCompleted: Boolean(innings?.completed),
        isDeathOvers: Boolean((innings?.over ?? 0) >= 15),
        isFixturesPage: false,
        failedPolls: runtime.failureCount,
        pollsLastMinute: health?.pollsLastMinute ?? 0,
      };
    },
    poll: () => pollAndIngest(matchId, externalMatchId),
    onStop: () => {
      markMatchDisconnected(matchId).catch((error) => {
        logger.error("PROVIDER", "provider_stop_mark_disconnected_failed", {
          matchId,
          error,
        });
      });
    },
  });
}

export function stopLiveMatchIngestor(matchId: string) {
  stopPollingSession(matchId);

  const runtime = runtimes.get(matchId);
  if (runtime) {
    runtime.abortController.abort();
    runtimes.delete(matchId);
  }

  markMatchDisconnected(matchId).catch((error) => {
    logger.error("PROVIDER", "provider_mark_disconnected_failed", {
      matchId,
      error,
    });
  });
}
