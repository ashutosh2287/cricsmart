type BattingIntentInput = {
  boundaries: number;
  attackingShots: number;
  legalBalls: number;
};

const BOUNDARY_INTENT_WEIGHT = 1.4;

export function calculateBattingIntent(input: BattingIntentInput): number {
  const legalBalls = Math.max(0, input.legalBalls);
  if (legalBalls === 0) return 0;

  const boundaries = Math.max(0, input.boundaries);
  const attackingShots = Math.max(0, input.attackingShots);
  const weightedIntent = boundaries * BOUNDARY_INTENT_WEIGHT + attackingShots;

  return Math.max(0, Math.min(100, (weightedIntent / legalBalls) * 100));
}
