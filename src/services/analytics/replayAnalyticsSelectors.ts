import type { MatchDomainEvent } from "@/services/match/events/matchEvents";
import type { InningsState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

export type ReplayWinProbabilityPoint = {
  over: number;
  batting: number;
  bowling: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

export type ReplayMomentumPoint = {
  over: number;
  score: number;
};

export type ReplayGraphData = {
  innings: InningsState[];
  momentumData: ReplayMomentumPoint[];
  winProbabilityData: ReplayWinProbabilityPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function extractBallEvents(events: MatchDomainEvent[]): BallEvent[] {
  return events
    .filter(
      (event): event is Extract<MatchDomainEvent, { type: "BALL" | "WICKET" }> =>
        event.type === "BALL" || event.type === "WICKET"
    )
    .map((event) => event.ballEvent);
}

function buildInnings(events: BallEvent[]): InningsState[] {
  const sorted = [...events].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  const inningsByIndex = new Map<number, InningsState>();
  const legalByInnings = new Map<number, number>();

  sorted.forEach((event) => {
    const inningsIndex = Number.isFinite(event.innings) ? Number(event.innings) : 0;
    const innings =
      inningsByIndex.get(inningsIndex) ??
      ({
        runs: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        overs: {},
        completed: false,
      } satisfies InningsState);

    const legalBalls = legalByInnings.get(inningsIndex) ?? 0;
    const derivedOver = Math.floor(legalBalls / 6);
    const eventOver = Number.isFinite(event.over) ? Math.floor(event.over) : derivedOver;
    const overKey = Math.max(0, eventOver);

    innings.overs[overKey] = [...(innings.overs[overKey] ?? []), event];
    innings.runs += event.totalRuns ?? event.runs ?? 0;
    if (event.wicket || event.type === "WICKET") {
      innings.wickets += 1;
    }

    const nextLegal = legalBalls + (event.isLegalDelivery ? 1 : 0);
    legalByInnings.set(inningsIndex, nextLegal);
    innings.over = Math.floor(nextLegal / 6);
    innings.ball = nextLegal % 6;
    inningsByIndex.set(inningsIndex, innings);
  });

  return [...inningsByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, innings]) => innings);
}

function buildMomentum(events: BallEvent[]): ReplayMomentumPoint[] {
  const sorted = [...events].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  let momentum = 0;
  let legal = 0;

  return sorted.map((event) => {
    const runs = event.totalRuns ?? event.runs ?? 0;
    const wicketImpact = event.wicket || event.type === "WICKET" ? -3 : 0;
    const dotImpact = event.isLegalDelivery && runs === 0 ? -1 : 0;
    momentum = clamp(momentum * 0.9 + runs + wicketImpact + dotImpact, -10, 10);

    if (event.isLegalDelivery) legal += 1;
    const fallbackOver = Math.floor(legal / 6) + (legal % 6) / 10;
    const over = Number.isFinite(event.over) ? Number(event.over) : fallbackOver;

    return {
      over,
      score: Number(momentum.toFixed(2)),
    };
  });
}

function buildWinProbability(events: BallEvent[]): ReplayWinProbabilityPoint[] {
  const sorted = [...events].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  let probability = 50;
  let legal = 0;

  return sorted.map((event) => {
    const runs = event.totalRuns ?? event.runs ?? 0;
    const wicketImpact = event.wicket || event.type === "WICKET" ? -8 : 0;
    const dotImpact = event.isLegalDelivery && runs === 0 ? -1 : 0;
    probability = clamp(probability + runs * 1.4 + wicketImpact + dotImpact, 1, 99);

    if (event.isLegalDelivery) legal += 1;
    const fallbackOver = Math.floor(legal / 6) + (legal % 6) / 10;
    const over = Number.isFinite(event.over) ? Number(event.over) : fallbackOver;

    return {
      over,
      batting: Number(probability.toFixed(2)),
      bowling: Number((100 - probability).toFixed(2)),
      marker:
        event.type === "WICKET"
          ? "WICKET"
          : event.type === "SIX"
            ? "SIX"
            : event.type === "FOUR"
              ? "FOUR"
              : undefined,
    };
  });
}

export function selectReplayGraphData(events: MatchDomainEvent[]): ReplayGraphData {
  const ballEvents = extractBallEvents(events);
  return {
    innings: buildInnings(ballEvents),
    momentumData: buildMomentum(ballEvents),
    winProbabilityData: buildWinProbability(ballEvents),
  };
}
