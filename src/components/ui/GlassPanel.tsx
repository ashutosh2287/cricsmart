import React from "react";

export default function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors duration-200 hover:border-[var(--border-med)] ${className}`}
    >
      {children}
    </div>
  );
}
