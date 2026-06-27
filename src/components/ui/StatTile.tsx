import { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

const trendColors = {
  up: "text-[var(--success)]",
  down: "text-[var(--danger)]",
  neutral: "text-[var(--text-2)]",
};

const trendArrows = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
};

export default function StatTile({
  label,
  value,
  icon,
  trend,
  trendValue,
  className = "",
}: StatTileProps) {
  return (
    <div className={`bg-[var(--surface-3)] rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[var(--text-2)] text-xs">{label}</p>
        {icon && <span className="text-[var(--text-3)]">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="font-semibold text-[var(--text-1)] font-mono tabular-nums">{value}</p>
        {trend && (
          <span className={`text-xs ${trendColors[trend]}`}>
            {trendArrows[trend]}{trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
