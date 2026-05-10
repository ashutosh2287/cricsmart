export function calculatePressure(
  runsRequired: number,
  ballsRemaining: number
): number {
  if (runsRequired <= 0) return 0;
  if (ballsRemaining <= 0) return 100;

  const requiredRate = (runsRequired * 6) / ballsRemaining;
  return Math.max(0, Math.min(100, requiredRate * 10));
}
