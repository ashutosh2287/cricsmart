import { ApiBallEvent } from "../api/cricketApiService";
import { smartReconcileMatch } from "../reconciliation/smartReconciler";
import { fetchWithRetry } from "../api/reliableFetch";
import { pushEvents, flushEvents } from "./eventBuffer";
import { isMatchActive } from "../match/matchManager";
import { redis } from "../queue/redisClient";
import { registerPlayer } from "../player/playerRegistry";
import { getMatchState, syncBattingOrder } from "../matchEngine";
import { getLiveProvider } from "@/services/providers/cricapiLiveProvider";
import {
  markMatchDisconnected,
  touchMatchHeartbeat,
} from "@/services/match/matchRegistry";

const pollingIntervals: Record<string, ReturnType<typeof setInterval>> = {};
const processedEvents: Record<string, Set<string>> = {};
const abortControllers: Record<string, AbortController> = {};
const lastProcessedPointer: Record<string, string> = {};
const activeExternalMatchId: Record<string, string> = {};

const POLL_INTERVAL = 4000;
const MAX_EVENT_CACHE = 300;
const MAX_EVENT_BATCH = 50;

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

export function startLiveMatchIngestor(matchId: string, externalMatchId: string) {
  if (pollingIntervals[matchId]) {
    console.warn(`⚠️ Ingestor already running for match: ${matchId}`);
    return;
  }

  const provider = getLiveProvider();

  processedEvents[matchId] = new Set();
  activeExternalMatchId[matchId] = externalMatchId;
  abortControllers[matchId]?.abort();
  abortControllers[matchId] = new AbortController();

  let pollCount = 0;
  let isReconciling = false;
  let isFetching = false;
  let failureCount = 0;
  let backoffUntil = 0;

  pollingIntervals[matchId] = setInterval(async () => {
    try {
      if (Date.now() < backoffUntil) return;

      pollCount += 1;

      if (!isMatchActive(matchId)) {
        stopLiveMatchIngestor(matchId);
        await markMatchDisconnected(matchId);
        return;
      }

      if (isFetching || isReconciling) {
        return;
      }

      isFetching = true;

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
          (signal) => provider.fetchEvents(externalMatchId, signal),
          abortControllers[matchId].signal
        );

        failureCount = 0;
      } catch (err) {
        failureCount += 1;

        if (failureCount >= 3) {
          const delay = Math.min(15000, failureCount * 3000);
          backoffUntil = Date.now() + delay;
        }

        await markMatchDisconnected(matchId);
        console.error(`❌ Live provider fetch failed (${failureCount})`, err);
        return;
      }

      if (!Array.isArray(events) || events.length === 0) {
        await touchMatchHeartbeat(matchId);
        return;
      }

      if (processedEvents[matchId].size === 0) {
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
        if (processedEvents[matchId].has(eventKey)) continue;

        const pointer = buildPointer(apiEvent);
        const lastPointer = lastProcessedPointer[matchId];

        if (lastPointer && comparePointers(pointer, lastPointer) <= 0) {
          continue;
        }

        await redis.lpush(`match:${matchId}:events`, JSON.stringify(apiEvent));

        lastProcessedPointer[matchId] = pointer;
        processedEvents[matchId].add(eventKey);

        if (typeof apiEvent.commentary === "string" && apiEvent.commentary.trim()) {
          latestCommentary = apiEvent.commentary.trim();
        }

        if (processedEvents[matchId].size > MAX_EVENT_CACHE) {
          const first = processedEvents[matchId].values().next().value;
          if (first) processedEvents[matchId].delete(first);
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

      if (pollCount % 3 === 0 && !isReconciling) {
        try {
          isReconciling = true;
          await smartReconcileMatch(
            matchId,
            externalMatchId,
            lastProcessedPointer[matchId]
          );
        } finally {
          isReconciling = false;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("❌ Live ingestion error:", err);
    } finally {
      isFetching = false;
    }
  }, POLL_INTERVAL);
}

export function stopLiveMatchIngestor(matchId: string) {
  if (pollingIntervals[matchId]) {
    clearInterval(pollingIntervals[matchId]);
    delete pollingIntervals[matchId];
  }

  abortControllers[matchId]?.abort();
  delete abortControllers[matchId];

  delete processedEvents[matchId];
  delete lastProcessedPointer[matchId];
  delete activeExternalMatchId[matchId];

  // Non-blocking on shutdown to avoid delaying interval teardown.
  markMatchDisconnected(matchId).catch((error) => {
    console.error("❌ Failed to mark match disconnected", error);
  });
}

export function isLiveMatchIngestorRunning(matchId: string): boolean {
  return Boolean(pollingIntervals[matchId]);
}

export function getLiveMatchIngestorExternalMatchId(matchId: string): string | null {
  return activeExternalMatchId[matchId] ?? null;
}