interface ScoreDisplayProps {
  runs: number;
  wickets: number;
  overs?: number;
  oversDisplay?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl md:text-3xl",
};

export default function ScoreDisplay({
  runs,
  wickets,
  overs,
  oversDisplay,
  size = "md",
  className = "",
}: ScoreDisplayProps) {
  const oversText = oversDisplay ?? (overs !== undefined ? `${overs}` : null);

  return (
    <div className={`font-mono font-semibold tabular-nums ${sizeClasses[size]} ${className}`}>
      <span>{runs}/{wickets}</span>
      {oversText && (
        <span className="text-[var(--text-2)] font-normal ml-1.5 text-[0.75em]">
          ({oversText} ov)
        </span>
      )}
    </div>
  );
}
