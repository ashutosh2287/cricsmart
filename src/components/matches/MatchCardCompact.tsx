import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";
import { MatchMetaRow } from "./MatchMetaRow";
import { MatchStatusPill } from "./MatchStatusPill";
import TeamLogo from "@/components/ui/TeamLogo";

export function MatchCardCompact({ match }: { match: CuratedMatch }) {
  const teamA = match.teamInfo?.[0]?.name ?? match.teams?.[0]?.name ?? "TBA";
  const teamB = match.teamInfo?.[1]?.name ?? match.teams?.[1]?.name ?? "TBA";

  return (
    <Link href={`/matches/${match.id}`}>
      <article className="h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--border-med)]">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-1)]">{match.title}</h3>
          <MatchStatusPill status={match.status} />
        </div>

        {/* Team Logos */}
        <div className="flex items-center gap-2 mb-2">
          <TeamLogo name={teamA} size="sm" />
          <span className="text-[10px] text-[var(--text-3)]">vs</span>
          <TeamLogo name={teamB} size="sm" />
        </div>

        <MatchMetaRow match={match} />

        {match.statusText ? (
          <p className="mt-2 line-clamp-1 text-[11px] text-[var(--text-3)]">{match.statusText}</p>
        ) : null}
      </article>
    </Link>
  );
}
