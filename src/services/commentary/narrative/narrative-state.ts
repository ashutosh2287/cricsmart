import type { BallEvent } from "@/types/ballEvent";
import type {
  CommentaryContext,
  CommentaryProbabilityState,
  MomentumState,
  NarrativeState,
  OverPhase,
  PressureLevel,
  CollapseRisk,
  PlayerNarrative,
} from "../types/commentary.types";

type NarrativeUpdateInput = {
  previousState: NarrativeState;
  ballEvent: BallEvent;
  context: CommentaryContext;
  probabilityState?: CommentaryProbabilityState;
  pressureLevel: PressureLevel;
  momentumState: MomentumState;
  momentumTeam: string | null;
  collapseRisk: CollapseRisk;
  turningPointDetected: boolean;
};

function createPlayerNarrative(
  player: string,
  previous: PlayerNarrative | undefined,
  values: Partial<PlayerNarrative>,
): PlayerNarrative {
  return {
    player,
    summary: values.summary ?? previous?.summary ?? "",
    recentRuns: values.recentRuns ?? previous?.recentRuns ?? 0,
    ballsFaced: values.ballsFaced ?? previous?.ballsFaced ?? 0,
    boundaries: values.boundaries ?? previous?.boundaries ?? 0,
    wickets: values.wickets ?? previous?.wickets ?? 0,
  };
}

export function createInitialNarrativeState(): NarrativeState {
  return {
    momentumTeam: null,
    pressureLevel: "LOW",
    collapseRisk: "LOW",
    currentPartnershipRuns: 0,
    recentBoundaryCount: 0,
    dotBallPressure: 0,
    battingControl: 50,
    chaseComplexity: 0,
    turningPointDetected: false,
    lastWicketOver: null,
    wicketsInCluster: 0,
    recentRuns: 0,
    recentWickets: 0,
    overPhase: "POWERPLAY",
    batterNarratives: {},
    bowlerNarratives: {},
  };
}

export function updateNarrativeState(input: NarrativeUpdateInput): NarrativeState {
  const batterSummary = input.ballEvent.type === "WICKET"
    ? `${input.context.batter} is dismissed under pressure.`
    : input.context.recentBoundaryCount >= 2
      ? `${input.context.batter} is finding the boundary regularly.`
      : input.context.recentRuns >= 10
        ? `${input.context.batter} is keeping the board moving.`
        : `${input.context.batter} is being tested for rhythm.`;

  const bowlerSummary = input.ballEvent.type === "WICKET"
    ? `${input.context.bowler} delivers a breakthrough.`
    : input.context.dotBallStreak >= 3
      ? `${input.context.bowler} is tightening the screws.`
      : input.context.recentRuns >= 12
        ? `${input.context.bowler} is under scoring pressure.`
        : `${input.context.bowler} is holding a disciplined line.`;

  const batterNarratives = {
    ...input.previousState.batterNarratives,
    [input.context.batter]: createPlayerNarrative(
      input.context.batter,
      input.previousState.batterNarratives[input.context.batter],
      {
        summary: batterSummary,
        recentRuns: input.context.recentRuns,
        ballsFaced: input.context.currentPartnershipBalls,
        boundaries: input.context.recentBoundaryCount,
      },
    ),
  };

  const bowlerNarratives = {
    ...input.previousState.bowlerNarratives,
    [input.context.bowler]: createPlayerNarrative(
      input.context.bowler,
      input.previousState.bowlerNarratives[input.context.bowler],
      {
        summary: bowlerSummary,
        recentRuns: input.context.recentOverRuns,
        ballsFaced: input.context.ball,
        wickets: input.context.wicketsInOver,
      },
    ),
  };

  const lastWicketOver =
    input.ballEvent.type === "WICKET"
      ? input.context.over
      : input.previousState.lastWicketOver;

  const probabilitySwing = Math.abs(
    (input.probabilityState?.currentWinProbability ?? 0) -
      (input.probabilityState?.previousWinProbability ?? 0),
  );

  const overPhase: OverPhase = input.context.overPhase;

  return {
    momentumTeam: input.momentumTeam,
    pressureLevel: input.pressureLevel,
    collapseRisk: input.collapseRisk,
    currentPartnershipRuns: input.context.currentPartnershipRuns,
    recentBoundaryCount: input.context.recentBoundaryCount,
    dotBallPressure: input.context.dotBallStreak,
    battingControl: input.context.battingControl,
    chaseComplexity: Math.max(input.context.chaseComplexity, probabilitySwing),
    turningPointDetected: input.turningPointDetected,
    lastWicketOver,
    wicketsInCluster: input.context.wicketsInCluster,
    recentRuns: input.context.recentRuns,
    recentWickets: input.context.recentWickets,
    overPhase,
    batterNarratives,
    bowlerNarratives,
  };
}
