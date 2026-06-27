import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function TrendIndicator({
  value,
  previousValue,
  suffix = "",
  decimals = 1,
  className = "",
}: TrendIndicatorProps) {
  const diff = previousValue !== undefined ? value - previousValue : 0;
  const direction = diff > 0.01 ? "up" : diff < -0.01 ? "down" : "neutral";

  const colors = {
    up: "text-[var(--success)]",
    down: "text-[var(--danger)]",
    neutral: "text-[var(--text-2)]",
  };

  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const Icon = icons[direction];

  return (
    <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${colors[direction]} ${className}`}>
      <Icon className="w-3 h-3" />
      {value.toFixed(decimals)}{suffix}
    </span>
  );
}
