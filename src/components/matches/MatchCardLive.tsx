import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";
import { MatchMetaRow } from "./MatchMetaRow";
import { MatchStatusPill } from "./MatchStatusPill";

function formatScore(r?: number, w?: number, o?: number): string {
  return `${r ?? 0}/${w ?? 0} (${o ?? 0} ov)`;
}

export function MatchCardLive({ match }: { match: CuratedMatch }) {
  return (
    <Link href={`/matches/${match.id}`}>
      <article className="w-[260px] shrink-0 rounded-lg border border-red-500/25 bg-zinc-900/85 p-3 transition-colors hover:border-red-400/40">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">{match.title}</h3>
          <MatchStatusPill status={match.status} />
        </div>

        {match.score.length > 0 ? (
          <div className="space-y-1 text-xs font-mono text-zinc-200">
            {match.score.slice(0, 2).map((entry, idx) => (
              <p key={idx} className="line-clamp-1">
                {entry.inning ? <span className="text-zinc-400">{entry.inning}: </span> : null}
                {formatScore(entry.r, entry.w, entry.o)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Live updates incoming</p>
        )}

        <MatchMetaRow match={match} />
      </article>
    </Link>
  );
}
