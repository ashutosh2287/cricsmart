export type ApiBallEvent = {
  id: string;
  over: number;
  ball: number;
  batsman: string;
  nonStriker?: string;
  bowler: string;
  runs: number;
  wicket: boolean;
  type: string;
  timestamp: number;
  innings: number;
  dismissal?: string;
  commentary?: string;
};

type ApiInnings = {
  overs?: {
    over?: number | string;
    balls?: {
      ball?: number | string;
      batsman?: string;
      nonStriker?: string;
      bowler?: string;
      runs?: number | string;
      wicket?: number;
      type?: string;
      commentary?: string;
      text?: string;
      dismissal?: string;
    }[];
  }[];
};

const API_BASE = "https://api.cricapi.com/v1";
const REQUEST_TIMEOUT = 8000;

function getApiKey(): string {
  const key = process.env.CRICKET_API_KEY ?? process.env.NEXT_PUBLIC_CRICKET_API_KEY;

  if (!key) {
    throw new Error("Missing CRICKET_API_KEY for live provider integration");
  }

  return key;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function generateEventId(
  matchId: string,
  innings: number,
  over: number,
  ball: number
) {
  return `${matchId}_${innings}_${over}_${ball}`;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      cache: "no-store",
    });

    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchLiveMatchEvents(
  matchId: string,
  signal?: AbortSignal
): Promise<ApiBallEvent[]> {
  const apiKey = getApiKey();
  const url = `${API_BASE}/match_scorecard?apikey=${apiKey}&id=${encodeURIComponent(matchId)}`;

  let res: Response;

  try {
    res = await fetchWithTimeout(url, { signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return [];
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`CricAPI error ${res.status}`);
  }

  const payload = await res.json();

  if (!payload?.data?.scorecard) return [];

  const now = Date.now();
  const events: ApiBallEvent[] = [];

  payload.data.scorecard.forEach((innings: ApiInnings, inningsIndex: number) => {
    const overs = innings?.overs ?? [];

    for (const over of overs) {
      const overNumber = toNumber(over?.over);
      const balls = over?.balls ?? [];

      for (const ball of balls) {
        const ballNumber = toNumber(ball?.ball);

        events.push({
          id: generateEventId(matchId, inningsIndex, overNumber, ballNumber),
          innings: inningsIndex,
          over: overNumber,
          ball: ballNumber,
          batsman: ball?.batsman ?? "Unknown",
          nonStriker: ball?.nonStriker,
          bowler: ball?.bowler ?? "Unknown",
          runs: toNumber(ball?.runs),
          wicket: ball?.wicket === 1,
          type: String(ball?.type ?? "RUN").toUpperCase(),
          timestamp: now,
          dismissal: ball?.dismissal,
          commentary: ball?.commentary ?? ball?.text,
        });
      }
    }
  });

  events.sort((a, b) => {
    if (a.innings !== b.innings) return a.innings - b.innings;
    if (a.over !== b.over) return a.over - b.over;
    return a.ball - b.ball;
  });

  return events;
}
