type SkeletonProps = {
  className?: string;
  variant?: "rect" | "text" | "circle";
};

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-white/[0.06]
        ${variant === "circle" ? "rounded-full" : "rounded-md"}
        ${variant === "text" ? "h-4 rounded" : ""}
        ${className}
      `}
    >
      {/* 🔥 SHIMMER EFFECT */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent
                     animate-[shimmer_1.5s_infinite]"
        />
      </div>
    </div>
  );
}