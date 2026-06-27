type SkeletonVariant = "rect" | "text" | "circle" | "chart" | "card" | "avatar" | "score" | "stat";

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  lines?: number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  rect: "rounded-md",
  text: "h-4 rounded",
  circle: "rounded-full",
  chart: "rounded-lg h-48",
  card: "rounded-xl h-32",
  avatar: "rounded-full h-12 w-12",
  score: "rounded-lg h-16",
  stat: "rounded-lg h-20",
};

export function Skeleton({ className = "", variant = "rect", lines = 1 }: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`relative overflow-hidden h-4 rounded ${i === lines - 1 ? "w-3/4" : ""} ${className}`}
            style={{
              background: "var(--surface-3)",
              backgroundSize: "200% 100%",
              backgroundImage: `linear-gradient(90deg, var(--surface-3) 0%, color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 20%, color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 40%, var(--surface-3) 60%)`,
              animation: "skeletonShimmer 1.8s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${variantStyles[variant]} ${className}`}
      style={{
        background: "var(--surface-3)",
        backgroundSize: "200% 100%",
        backgroundImage: `linear-gradient(90deg, var(--surface-3) 0%, color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 20%, color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 40%, var(--surface-3) 60%)`,
        animation: "skeletonShimmer 1.8s ease-in-out infinite",
      }}
    />
  );
}

export function ScoreCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="rect" className="w-12 h-5 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton variant="score" className="w-full" />
      <Skeleton variant="text" lines={2} />
    </div>
  );
}
