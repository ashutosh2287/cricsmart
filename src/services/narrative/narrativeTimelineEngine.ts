// src/services/narrative/narrativeTimelineEngine.ts


export type NarrativePhaseType =
  | "POWERPLAY_ASSAULT"
  | "BOWLER_CONTROL"
  | "MOMENTUM_SHIFT"
  | "COLLAPSE_PHASE"
  | "RECOVERY_PHASE"
  | "DEATH_OVER_DRAMA"
  | "CLIMAX_FINISH"

export interface NarrativeSegment {
  phase: NarrativePhaseType
  startBall: number
  endBall: number
}

export interface NarrativeTimeline {
  segments: NarrativeSegment[]
}

export interface NarrativeInputs {
  momentum: number
  pressure: number
  winProbability: number
  wickets: number
  over: number
  ballNumber: number
}

export function computeNarrativePhase(input: NarrativeInputs): NarrativePhaseType | null {
  const { momentum, pressure, wickets, over, winProbability } = input

  // Powerplay aggression
  if (over <= 6 && momentum > 0.7) {
    return "POWERPLAY_ASSAULT"
  }

  // Bowler control phase
  if (momentum < -0.5 && pressure > 0.6) {
    return "BOWLER_CONTROL"
  }

  // Collapse detection
  if (wickets >= 2 && pressure > 0.8) {
    return "COLLAPSE_PHASE"
  }

  // Recovery phase
  if (momentum > 0.4 && pressure < 0.4) {
    return "RECOVERY_PHASE"
  }

  // Death over drama
  if (over >= 17 && pressure > 0.7) {
    return "DEATH_OVER_DRAMA"
  }

  // Final climax
  if (over >= 19 && Math.abs(winProbability - 0.5) < 0.15) {
    return "CLIMAX_FINISH"
  }

  return null
}

export function buildNarrativeTimeline(
  inputs: NarrativeInputs[],
): NarrativeTimeline {
  const segments: NarrativeSegment[] = []

  let currentPhase: NarrativePhaseType | null = null
  let phaseStartBall = 0

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
if (!input) continue

const phase = computeNarrativePhase(input)

    if (phase !== currentPhase) {
      if (currentPhase !== null) {
        segments.push({
          phase: currentPhase,
          startBall: phaseStartBall,
          endBall: i - 1,
        })
      }

      currentPhase = phase
      phaseStartBall = i
    }
  }

  if (currentPhase !== null) {
    segments.push({
      phase: currentPhase,
      startBall: phaseStartBall,
      endBall: inputs.length - 1,
    })
  }

  return { segments }
}