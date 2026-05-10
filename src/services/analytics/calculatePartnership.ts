type PartnershipInput = {
  strikerRuns: number;
  nonStrikerRuns: number;
  balls: number;
};

export function calculatePartnership(input: PartnershipInput) {
  const runs = Math.max(0, input.strikerRuns) + Math.max(0, input.nonStrikerRuns);
  const balls = Math.max(0, input.balls);
  const runRate = balls > 0 ? (runs * 6) / balls : 0;

  return {
    runs,
    balls,
    runRate,
  };
}
