import React from "react";

export default function GlassPanel({
  children,
  className = "",
  variant = "section",
  dense = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "section" | "rail" | "inset";
  dense?: boolean;
}) {
  const baseClass =
    variant === "rail" ? "ui-rail" : variant === "inset" ? "ui-inset" : "ui-section";

  return (
    <div
      className={`${baseClass} ${dense ? "p-3" : ""} transition-colors duration-200 hover:border-white/15 ${className}`}
    >
      {children}
    </div>
  );
}
