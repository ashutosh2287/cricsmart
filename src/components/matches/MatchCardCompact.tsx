import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";
import { MatchMetaRow } from "./MatchMetaRow";
import { MatchStatusPill } from "./MatchStatusPill";

export function MatchCardCompact({ match }: { match: CuratedMatch }) {
  return (
    <Link href={`/matches/${match.id}`}>
      <article className="h-full rounded-lg border border-white/10 bg-zinc-900/70 p-3 transition-colors hover:border-white/20">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100">{match.title}</h3>
          <MatchStatusPill status={match.status} />
        </div>

        <MatchMetaRow match={match} />

        {match.statusText ? <p className="mt-2 line-clamp-1 text-[11px] text-zinc-400">{match.statusText}</p> : null}
      </article>
    </Link>
  );
}
