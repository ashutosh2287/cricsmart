// src/services/api/cricketApiService.ts

export type ApiBallEvent = {
  id: string
  over: number
  ball: number
  batsman: string
  bowler: string
  runs: number
  wicket: boolean
  type: string
  timestamp: number
}

const API_BASE = "https://api.cricapi.com/v1"
const API_KEY = process.env.NEXT_PUBLIC_CRICKET_API_KEY

const REQUEST_TIMEOUT = 8000

function generateEventId(matchId: string, over: number, ball: number) {
  return `${matchId}_${over}_${ball}`
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 8000
) {
  const controller = new AbortController();

  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal, // ✅ FIX
    });

    return response;

  } finally {
    clearTimeout(id);
  }
}

export async function fetchLiveMatchEvents(
  matchId: string,
  signal?: AbortSignal // ✅ ADD THIS
): Promise<ApiBallEvent[]> {

  const url = `${API_BASE}/match_scorecard?apikey=${API_KEY}&id=${matchId}`;

  let res: Response;

  try {
    // ✅ pass signal into fetch
    res = await fetchWithTimeout(url, { signal });

  } catch (err: any) {

    // ✅ IMPORTANT: ignore abort safely
    if (err.name === "AbortError") {
      return [];
    }

    throw err;
  }

  if (!res.ok) {
    throw new Error(`CricAPI error ${res.status}`);
  }

  const data = await res.json();

  if (!data?.data?.scorecard) return [];

  const now = Date.now();

  const events: ApiBallEvent[] = [];

  for (const innings of data.data.scorecard) {

    for (const over of innings.overs ?? []) {

      for (const ball of over.balls ?? []) {

        events.push({
          id: generateEventId(matchId, over.over, ball.ball),

          over: over.over,
          ball: ball.ball,

          batsman: ball.batsman ?? "",
          bowler: ball.bowler ?? "",

          runs: ball.runs ?? 0,
          wicket: ball.wicket === 1,

          type: ball.type ?? "RUN",

          timestamp: now
        });

      }

    }

  }

  return events;
}