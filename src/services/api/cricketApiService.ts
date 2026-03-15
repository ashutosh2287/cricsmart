// src/services/api/cricketApiService.ts

export type ApiBallEvent = {
  over: number
  ball: number
  batsman: string
  bowler: string
  runs: number
  wicket: boolean
  type: string
}

type CricApiBall = {
  over: number
  ball: number
  batsman: string
  bowler: string
  runs: number
  wicket: number
  type?: string
}

type CricApiResponse = {
  data: CricApiBall[]
}

const API_BASE = "https://api.cricapi.com/v1"

const API_KEY = process.env.NEXT_PUBLIC_CRICKET_API_KEY

export async function fetchLiveMatchEvents(matchId: string): Promise<ApiBallEvent[]> {

  const url = `${API_BASE}/match_balls?apikey=${API_KEY}&id=${matchId}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error("Failed to fetch live match events")
  }

  const data: CricApiResponse = await res.json()

  if (!data?.data) {
    return []
  }

  return data.data.map((ball) => ({
    over: ball.over,
    ball: ball.ball,
    batsman: ball.batsman,
    bowler: ball.bowler,
    runs: ball.runs,
    wicket: ball.wicket === 1,
    type: ball.type ?? "RUN"
  }))
}