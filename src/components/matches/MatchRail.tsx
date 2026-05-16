import { CuratedMatch } from "@/services/matches/types";
import { EmptyLiveState } from "./EmptyLiveState";
import { MatchCardLive } from "./MatchCardLive";

export function MatchRail({ matches }: { matches: CuratedMatch[] }) {
  if (matches.length === 0) return <EmptyLiveState />;

  return (
    <div className="sports-scrollbar flex gap-2.5 overflow-x-auto pb-1">
      {matches.map((match) => (
        <MatchCardLive key={match.id} match={match} />
      ))}
    </div>
  );
}
