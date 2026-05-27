type SkeletonProps = {
  className?: string;
  variant?: "rect" | "text" | "circle";
};

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-[var(--surface-3)]
        animate-[pulse_1.5s_ease-in-out_infinite]
        ${variant === "circle" ? "rounded-full" : "rounded-md"}
        ${variant === "text" ? "h-4 rounded" : ""}
        ${className}
      `}
    >
    </div>
  );
}
