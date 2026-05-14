import { BallEvent } from "@/types/ballEvent";
import { MatchState } from "@/services/matchEngine";
import { WinProbabilityFeatures } from "./featureTypes";

function getPhase(over: number): WinProbabilityFeatures["phaseOfMatch"] {
  if (over < 6) return "powerplay";
  if (over < 15) return "middle";
  return "death";
}

function calculateRecentRuns(events: BallEvent[]): number {
  const recent = events.slice(-6);
  return recent.reduce((sum, event) => sum + (event.totalRuns ?? event.runs ?? 0), 0);
}

function calculateRecentWickets(events: BallEvent[]): number {
  const recent = events.slice(-6);
  return recent.reduce((sum, event) => sum + (event.wicket ? 1 : 0), 0);
}

function calculatePartnershipRuns(state: MatchState): number {
  const innings = state.innings[state.currentInningsIndex];
  const deliveries = Object.values(innings.overs).flat();

  let partnership = 0;
  for (let i = deliveries.length - 1; i >= 0; i -= 1) {
    const event = deliveries[i];
    partnership += event.totalRuns ?? event.runs ?? 0;
    if (event.wicket) break;
  }

  return partnership;
}

export function generateWinProbabilityFeatures(
  state: MatchState,
  eventStream: BallEvent[]
): WinProbabilityFeatures {
  const inningsIndex = state.currentInningsIndex;
  const inningsState = state.innings[inningsIndex];

  const ballsBowled = inningsState.over * 6 + inningsState.ball;
  const maxBalls = (state.configOvers ?? 20) * 6;

  const target =
    inningsIndex === 1
      ? (state.innings[0]?.runs ?? 0) + 1
      : 0;

  const ballsRemaining = Math.max(0, maxBalls - ballsBowled);
  const requiredRuns = inningsIndex === 1 ? Math.max(0, target - inningsState.runs) : 0;

  const currentRunRate = ballsBowled > 0 ? (inningsState.runs / ballsBowled) * 6 : 0;
  const requiredRunRate =
    inningsIndex === 1 && ballsRemaining > 0
      ? (requiredRuns / ballsRemaining) * 6
      : 0;

  return {
    currentScore: inningsState.runs,
    wicketsLost: inningsState.wickets,
    oversCompleted: inningsState.over + inningsState.ball / 6,
    ballsRemaining,
    target,
    requiredRunRate,
    currentRunRate,
    recentRuns: calculateRecentRuns(eventStream),
    recentWickets: calculateRecentWickets(eventStream),
    phaseOfMatch: getPhase(inningsState.over),
    innings: inningsIndex === 0 ? 1 : 2,
    battingFirst: inningsIndex === 0 ? 1 : 0,
    partnershipRuns: calculatePartnershipRuns(state),
  };
}
