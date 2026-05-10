type BowlingPressureInput = {
  dotBalls: number;
  wickets: number;
  legalBalls: number;
};

const DOT_BALL_WEIGHT = 70;
const WICKET_WEIGHT_CAP = 30;
const PER_WICKET_PRESSURE = 10;

export function calculateBowlingPressure(input: BowlingPressureInput): number {
  const legalBalls = Math.max(0, input.legalBalls);
  if (legalBalls === 0) return 0;

  const dotBalls = Math.max(0, input.dotBalls);
  const wickets = Math.max(0, input.wickets);
  const dotComponent = (dotBalls / legalBalls) * DOT_BALL_WEIGHT;
  const wicketComponent = Math.min(
    WICKET_WEIGHT_CAP,
    wickets * PER_WICKET_PRESSURE
  );

  return Math.max(0, Math.min(100, dotComponent + wicketComponent));
}
