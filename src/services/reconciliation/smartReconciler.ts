import {
  getMatchState,
  dispatchBallEvent,
} from "../matchEngine";
import { adaptApiEventToEngineEvent } from "../adapters/cricketEventAdapter";
import { getLiveProvider } from "@/services/providers/cricapiLiveProvider";
import { touchMatchHeartbeat } from "@/services/match/matchRegistry";
import type { ApiBallEvent } from "../api/cricketApiService";

function buildPointer(e: ApiBallEvent) {
  return `${e.innings}-${e.over}-${e.ball}`;
}

function pointerTuple(pointer: string): [number, number, number] {
  const [innings, over, ball] = pointer.split("-").map(Number);
  return [innings || 0, over || 0, ball || 0];
}

function comparePointer(a: string, b: string): number {
  const [aInn, aOver, aBall] = pointerTuple(a);
  const [bInn, bOver, bBall] = pointerTuple(b);
  if (aInn !== bInn) return aInn - bInn;
  if (aOver !== bOver) return aOver - bOver;
  return aBall - bBall;
}

const MAX_DRIFT = 12;

export async function smartReconcileMatch(
  matchId: string,
  externalMatchId: string,
  lastPointer?: string
) {
  const engineState = getMatchState(matchId);
  if (!engineState) return;

  const provider = getLiveProvider();
  const apiEvents = await provider.fetchEvents(externalMatchId);
  if (!apiEvents.length) return;

  const replayed = new Set<string>();
  let startIndex = 0;

  if (lastPointer) {
    const idx = apiEvents.findIndex((e) => buildPointer(e) === lastPointer);

    if (idx !== -1) {
      startIndex = idx + 1;
    } else {
      startIndex = apiEvents.findIndex((e) => comparePointer(buildPointer(e), lastPointer) > 0);
      if (startIndex < 0) {
        startIndex = apiEvents.length;
      }
    }
  }

  const drift = apiEvents.length - startIndex;

  if (drift > MAX_DRIFT) {
    const { resetMatchState } = await import("../matchEngine");
    const { stopWorker, startWorker } = await import("../queue/eventWorker");

    stopWorker(matchId);
    resetMatchState(matchId);

    for (const apiEvent of apiEvents) {
      const pointer = buildPointer(apiEvent);
      if (replayed.has(pointer)) continue;
      replayed.add(pointer);

      const state = getMatchState(matchId);
      const innings = state?.innings[state.currentInningsIndex];

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

      dispatchBallEvent(matchId, engineEvent);
    }

    startWorker(matchId);
  } else if (startIndex < apiEvents.length) {
    for (let i = startIndex; i < apiEvents.length; i++) {
      const apiEvent = apiEvents[i];
      const pointer = buildPointer(apiEvent);

      if (replayed.has(pointer)) continue;
      replayed.add(pointer);

      const state = getMatchState(matchId);
      const innings = state?.innings[state.currentInningsIndex];

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

      dispatchBallEvent(matchId, engineEvent);
    }
  }

  const refreshed = getMatchState(matchId);
  const current = refreshed?.innings[refreshed.currentInningsIndex];

  await touchMatchHeartbeat(matchId, {
    currentRuns: current?.runs,
    currentWickets: current?.wickets,
    currentOver: current?.over,
    currentBall: current?.ball,
    score: current ? `${current.runs}/${current.wickets}` : undefined,
    overDisplay: current ? `${current.over}.${current.ball}` : undefined,
  });
}
