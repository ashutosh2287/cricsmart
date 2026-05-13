import { MatchStatus } from "@/services/matches/types";
import { LivePulse } from "./LivePulse";

export function MatchStatusPill({ status }: { status: MatchStatus }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
        <LivePulse /> LIVE
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300">
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-300">
      Upcoming
    </span>
  );
}
