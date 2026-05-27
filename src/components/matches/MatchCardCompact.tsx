import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";
import { MatchMetaRow } from "./MatchMetaRow";
import { MatchStatusPill } from "./MatchStatusPill";
import { Card } from "@/components/ui/Card";

export function MatchCardCompact({ match }: { match: CuratedMatch }) {
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card hover className="h-full p-3 cursor-pointer">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">{match.title}</h3>
          <MatchStatusPill status={match.status} />
        </div>

        <MatchMetaRow match={match} />

        {match.statusText ? (
          <p className="mt-2 line-clamp-1 text-[11px] text-[var(--text-muted)]">{match.statusText}</p>
        ) : null}
      </Card>
    </Link>
  );
}
