import { MatchStatus } from "@/services/matches/types";
import { LivePulse } from "./LivePulse";

export function MatchStatusPill({ status }: { status: MatchStatus }) {
  if (status === "live") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          borderColor: "color-mix(in srgb, var(--danger) 35%, transparent)",
          background: "color-mix(in srgb, var(--danger) 12%, transparent)",
          color: "var(--danger)",
        }}
      >
        <LivePulse /> LIVE
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Completed
      </span>
    );
  }

  return (
    <span
      className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{
        borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
        color: "var(--accent)",
      }}
    >
      Upcoming
    </span>
  );
}
