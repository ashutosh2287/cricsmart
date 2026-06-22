type SkeletonVariant = "rect" | "text" | "circle" | "chart" | "card" | "avatar";

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

const variantStyles: Record<SkeletonVariant, string> = {
  rect: "rounded-md",
  text: "h-4 rounded",
  circle: "rounded-full",
  chart: "rounded-lg h-48",
  card: "rounded-xl h-32",
  avatar: "rounded-full h-12 w-12",
};

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden ${variantStyles[variant]} ${className}`}
      style={{
        background: "var(--surface-3)",
        backgroundSize: "200% 100%",
        backgroundImage: `linear-gradient(
          90deg,
          var(--surface-3) 0%,
          color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 20%,
          color-mix(in srgb, var(--surface-3) 60%, var(--surface)) 40%,
          var(--surface-3) 60%
        )`,
        animation: "skeletonShimmer 1.8s ease-in-out infinite",
      }}
    />
  );
}
