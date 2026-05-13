import { CuratedMatch } from "@/services/matches/types";

export function MatchMetaRow({ match }: { match: CuratedMatch }) {
  const when = Number.isNaN(new Date(match.startTime).getTime())
    ? null
    : new Date(match.startTime).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
      <span className="rounded border border-white/10 px-1.5 py-0.5 font-medium text-zinc-300">{match.uiBadge ?? match.format}</span>
      <span className="truncate">{match.seriesName}</span>
      {when ? <span>• {when}</span> : null}
    </div>
  );
}
