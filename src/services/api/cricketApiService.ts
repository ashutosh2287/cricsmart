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

async function fetchWithTimeout(url: string) {

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {

    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    })

    return res

  } finally {
    clearTimeout(timeout)
  }

}

export async function fetchLiveMatchEvents(
  matchId: string
): Promise<ApiBallEvent[]> {

  const url = `${API_BASE}/match_scorecard?apikey=${API_KEY}&id=${matchId}`

  const res = await fetchWithTimeout(url)

  if (!res.ok) {
    throw new Error(`CricAPI error ${res.status}`)
  }

  const data = await res.json()

  if (!data?.data?.scorecard) return []

  const now = Date.now()

  const events: ApiBallEvent[] = []

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
        })

      }

    }

  }

  return events
}