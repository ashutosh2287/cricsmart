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
      className={`rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-[var(--accent-brand)] ${className}`}
    >
      {children}
    </div>
  );
}
