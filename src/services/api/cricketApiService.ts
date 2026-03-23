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
  innings: number // 🔥 NEW (important)
}

type ApiInnings = {
  overs?: {
    over?: number | string
    balls?: {
      ball?: number | string
      batsman?: string
      bowler?: string
      runs?: number | string
      wicket?: number
      type?: string
    }[]
  }[]
}

const API_BASE = "https://api.cricapi.com/v1"
const API_KEY = process.env.NEXT_PUBLIC_CRICKET_API_KEY

const REQUEST_TIMEOUT = 8000

function generateEventId(
  matchId: string,
  innings: number,
  over: number,
  ball: number
) {
  return `${matchId}_${innings}_${over}_${ball}`
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    })

    return response
  } finally {
    clearTimeout(id)
  }
}

export async function fetchLiveMatchEvents(
  matchId: string,
  signal?: AbortSignal
): Promise<ApiBallEvent[]> {

  const url = `${API_BASE}/match_scorecard?apikey=${API_KEY}&id=${matchId}`

  let res: Response

  try {
    res = await fetchWithTimeout(url, { signal })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return []
    }
    throw err
  }

  if (!res.ok) {
    throw new Error(`CricAPI error ${res.status}`)
  }

  const data = await res.json()

  if (!data?.data?.scorecard) return []

  const now = Date.now()
  const events: ApiBallEvent[] = []

  // 🔥 LOOP WITH INNINGS INDEX
  data.data.scorecard.forEach((innings: ApiInnings, inningsIndex: number) => {
    const overs = innings?.overs ?? []

    for (const over of overs) {

      const overNumber = Number(over?.over) || 0
      const balls = over?.balls ?? []

      for (const ball of balls) {

        const ballNumber = Number(ball?.ball) || 0

        events.push({
          id: generateEventId(matchId, inningsIndex, overNumber, ballNumber),

          innings: inningsIndex,

          over: overNumber,
          ball: ballNumber,

          batsman: ball?.batsman ?? "Unknown",
          bowler: ball?.bowler ?? "Unknown",

          runs: Number(ball?.runs) || 0,
          wicket: ball?.wicket === 1,

          type: ball?.type ?? "RUN",

          timestamp: now
        })
      }
    }
  })

  // 🔥 SORT EVENTS (CRITICAL)
  events.sort((a, b) => {
    if (a.innings !== b.innings) return a.innings - b.innings
    if (a.over !== b.over) return a.over - b.over
    return a.ball - b.ball
  })

  return events
}