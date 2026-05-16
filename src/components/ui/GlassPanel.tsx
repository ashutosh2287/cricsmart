import React from "react";

export default function GlassPanel({
  children,
  className = "",
  level = "secondary",
}: {
  children: React.ReactNode;
  className?: string;
  level?: "primary" | "secondary" | "tertiary";
}) {
  const hierarchyClass =
    level === "primary"
      ? "hierarchy-primary"
      : level === "tertiary"
        ? "hierarchy-tertiary"
        : "hierarchy-secondary";

  return (
    <div
      className={`card ${hierarchyClass} rounded-[10px] bg-[var(--bg-surface)] p-3.5 transition-all duration-200 hover:translate-y-[-1px] ${className}`}
    >
      {children}
    </div>
  );
}
