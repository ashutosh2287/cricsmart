type BowlingPressureInput = {
  dotBalls: number;
  wickets: number;
  legalBalls: number;
};

export function calculateBowlingPressure(input: BowlingPressureInput): number {
  const legalBalls = Math.max(0, input.legalBalls);
  if (legalBalls === 0) return 0;

  const dotBalls = Math.max(0, input.dotBalls);
  const wickets = Math.max(0, input.wickets);
  const dotComponent = (dotBalls / legalBalls) * 70;
  const wicketComponent = Math.min(30, wickets * 10);

  return Math.max(0, Math.min(100, dotComponent + wicketComponent));
}
