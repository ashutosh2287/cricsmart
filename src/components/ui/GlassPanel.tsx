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
      className={`
        rounded-xl
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-sm
        p-4
        transition-colors duration-200
        hover:border-white/20
        ${className}
      `}
    >
      {children}
    </div>
  );
}