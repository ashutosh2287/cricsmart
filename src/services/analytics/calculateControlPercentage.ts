type ControlPercentageInput = {
  controlledBalls: number;
  legalBalls: number;
};

export function calculateControlPercentage(
  input: ControlPercentageInput
): number {
  const legalBalls = Math.max(0, input.legalBalls);
  if (legalBalls === 0) return 0;

  const controlledBalls = Math.max(0, input.controlledBalls);
  return Math.max(0, Math.min(100, (controlledBalls / legalBalls) * 100));
}
