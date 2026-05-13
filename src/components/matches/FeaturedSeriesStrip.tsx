import { CuratedMatch } from "@/services/matches/types";

export function FeaturedSeriesStrip({ matches }: { matches: CuratedMatch[] }) {
  const uniqueSeries = [...new Set(matches.map((match) => match.seriesName).filter(Boolean))].slice(0, 10);

  if (uniqueSeries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {uniqueSeries.map((series) => (
        <span
          key={series}
          className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300"
        >
          {series}
        </span>
      ))}
    </div>
  );
}
