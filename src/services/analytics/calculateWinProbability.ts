type WinProbabilityPoint = {
  over: number;
  value: number;
};

export type WinProbabilityChartPoint = {
  over: number;
  batting: number;
  bowling: number;
};

export function calculateWinProbability(
  points: WinProbabilityPoint[] | undefined | null
): WinProbabilityChartPoint[] {
  if (!points || !Array.isArray(points)) return [];

  return points.map((point) => {
    const batting = Math.max(0, Math.min(100, point.value));
    return {
      over: point.over,
      batting,
      bowling: 100 - batting,
    };
  });
}
