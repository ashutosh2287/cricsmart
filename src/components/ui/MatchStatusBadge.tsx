import { LivePulse } from "@/components/matches/LivePulse";

type Status = "live" | "completed" | "upcoming" | "stale";

interface MatchStatusBadgeProps {
  status: Status;
  showPulse?: boolean;
  className?: string;
}

const statusConfig: Record<Status, { label: string; borderColor: string; bgColor: string; textColor: string }> = {
  live: {
    label: "LIVE",
    borderColor: "color-mix(in srgb, var(--danger) 35%, transparent)",
    bgColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
    textColor: "var(--danger)",
  },
  completed: {
    label: "Completed",
    borderColor: "var(--border-subtle)",
    bgColor: "var(--bg-overlay)",
    textColor: "var(--text-muted)",
  },
  upcoming: {
    label: "Upcoming",
    borderColor: "color-mix(in srgb, var(--brand) 35%, transparent)",
    bgColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
    textColor: "var(--brand)",
  },
  stale: {
    label: "Delayed",
    borderColor: "color-mix(in srgb, var(--amber) 35%, transparent)",
    bgColor: "color-mix(in srgb, var(--amber) 12%, transparent)",
    textColor: "var(--amber)",
  },
};

export default function MatchStatusBadge({
  status,
  showPulse = true,
  className = "",
}: MatchStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
      style={{
        borderColor: config.borderColor,
        background: config.bgColor,
        color: config.textColor,
      }}
    >
      {status === "live" && showPulse && <LivePulse />}
      {config.label}
    </span>
  );
}
