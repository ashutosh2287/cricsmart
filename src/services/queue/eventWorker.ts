import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { ApiBallEvent } from "../api/cricketApiService";
import { redis } from "./redisClient";
import { touchMatchHeartbeat } from "@/services/match/matchRegistry";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

const workers: Record<string, boolean> = {};
const workerLocks = new Set<string>();

const processedPointers: Record<string, string> = {};
const processedKeys: Record<string, Set<string>> = {};
const MAX_CACHE = 300;
const DEFAULT_MAX_EVENT_AGE_MS = 120000;

function resolveMaxEventAgeMs() {
  const parsed = Number(process.env.LIVE_EVENT_MAX_AGE_MS ?? DEFAULT_MAX_EVENT_AGE_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_EVENT_AGE_MS;
  }
  return parsed;
}

const MAX_EVENT_AGE_MS = resolveMaxEventAgeMs();

function buildEventKey(apiEvent: ApiBallEvent) {
  return apiEvent.id || `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}-${apiEvent.runs}-${apiEvent.type}-w${apiEvent.wicket ? 1 : 0}`;
}

function buildPointer(apiEvent: ApiBallEvent) {
  return `${apiEvent.innings}-${apiEvent.over}-${apiEvent.ball}`;
}

function parsePointer(pointer: string): [number, number, number] {
  const [innings, over, ball] = pointer.split("-").map(Number);
  return [innings || 0, over || 0, ball || 0];
}

function isNewerPointer(pointer: string, previous?: string) {
  if (!previous) return true;

  const [aInnings, aOver, aBall] = parsePointer(pointer);
  const [bInnings, bOver, bBall] = parsePointer(previous);

  if (aInnings !== bInnings) return aInnings > bInnings;
  if (aOver !== bOver) return aOver > bOver;
  return aBall > bBall;
}

function isStaleEvent(apiEvent: ApiBallEvent) {
  if (!apiEvent.timestamp || !Number.isFinite(apiEvent.timestamp)) return false;
  return Date.now() - apiEvent.timestamp > MAX_EVENT_AGE_MS;
}

export function isWorkerRunning(matchId: string) {
  return workerLocks.has(matchId) && workers[matchId] === true;
}

export function startWorker(matchId: string) {
  if (workerLocks.has(matchId)) {
    console.log(`⚠️ Worker already running for ${matchId}`);
    return false;
  }

  workerLocks.add(matchId);
  workers[matchId] = true;
  processedKeys[matchId] = processedKeys[matchId] ?? new Set();
  processedPointers[matchId] = processedPointers[matchId] ?? "";

  const storage = new RedisSimulationStorage();

  (async function loop() {
    while (workers[matchId]) {
      try {
        const res = await redis.brpop(`match:${matchId}:events`, 5);
        if (!res) continue;

        const [, payload] = res;
        const apiEvent: ApiBallEvent = JSON.parse(payload);

        const eventKey = buildEventKey(apiEvent);
        const pointer = buildPointer(apiEvent);

        if (processedKeys[matchId].has(eventKey)) {
          continue;
        }

        if (!isNewerPointer(pointer, processedPointers[matchId])) {
          continue;
        }

        if (isStaleEvent(apiEvent)) {
          continue;
        }

        const state = getMatchState(matchId);
        if (!state) continue;

        const innings = state.innings[state.currentInningsIndex];
        if (!innings?.striker || !innings?.nonStriker) continue;

        const engineEvent = adaptApiEventToEngineEvent(
          matchId,
          apiEvent,
          innings.striker,
          innings.nonStriker,
          innings.battingTeam || "",
          innings.bowlingTeam || ""
        );

        if (!engineEvent) continue;

        const dispatchResult = dispatchBallEvent(matchId, engineEvent);
        if (!dispatchResult.ok) {
          if (dispatchResult.reason !== "DUPLICATE_EVENT") {
            console.warn("⚠️ Worker rejected event", {
              matchId,
              reason: dispatchResult.reason,
              pointer,
            });
          }
          continue;
        }

        processedKeys[matchId].add(eventKey);
        processedPointers[matchId] = pointer;

        if (processedKeys[matchId].size > MAX_CACHE) {
          const first = processedKeys[matchId].values().next().value;
          if (first) processedKeys[matchId].delete(first);
        }

        const latest = getMatchState(matchId);
        const latestInnings = latest?.innings[latest.currentInningsIndex];

        if (latest) {
          await storage.save(matchId, latest, {
            isRunning: true,
            isPaused: false,
            speed: 1500,
          });
        }

        await touchMatchHeartbeat(matchId, {
          currentRuns: latestInnings?.runs,
          currentWickets: latestInnings?.wickets,
          currentOver: latestInnings?.over,
          currentBall: latestInnings?.ball,
          score:
            latestInnings
              ? `${latestInnings.runs}/${latestInnings.wickets}`
              : undefined,
          overDisplay:
            latestInnings
              ? `${latestInnings.over}.${latestInnings.ball}`
              : undefined,
        });
      } catch (err) {
        console.error("❌ Worker error:", err);
      }
    }
  })();

  return true;
}

export function stopWorker(matchId: string) {
  workers[matchId] = false;
  workerLocks.delete(matchId);
  delete processedPointers[matchId];
  delete processedKeys[matchId];
}

export function isWorkerRunning(matchId: string): boolean {
  return workerLocks.has(matchId) && workers[matchId] === true;
}
