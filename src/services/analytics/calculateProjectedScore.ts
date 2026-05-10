type ProjectedScoreInput = {
  runs: number;
  ballsFaced: number;
  totalOvers?: number;
};

export function calculateProjectedScore(
  input: ProjectedScoreInput
): {
  projectedScore: number;
  currentRunRate: number;
} {
  const ballsFaced = Math.max(0, input.ballsFaced);
  const runs = Math.max(0, input.runs);
  const totalOvers = Math.max(1, input.totalOvers ?? 20);

  if (ballsFaced === 0) {
    return {
      projectedScore: 0,
      currentRunRate: 0,
    };
  }

  const oversFaced = ballsFaced / 6;
  const currentRunRate = runs / oversFaced;

  return {
    projectedScore: Math.round(currentRunRate * totalOvers),
    currentRunRate,
  };
}
