type MomentumPoint = {
  over: number;
  score: number;
};

export type ChartMomentumPoint = {
  over: number;
  momentum: number;
};

export function calculateMomentum(
  points: MomentumPoint[] | undefined | null
): ChartMomentumPoint[] {
  if (!points || !Array.isArray(points)) return [];

  return points.map((point, index) => ({
    over: Number.isFinite(point.over) ? point.over : index,
    momentum: point.score,
  }));
}
