"use client";

import React from "react";

type MatchVisibilityGuardProps = {
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
};

export default function MatchVisibilityGuard({
  children,
  className,
  isVisible = true,
}: MatchVisibilityGuardProps) {
  return (
    <div
      className={className}
      style={{ visibility: isVisible ? "visible" : "hidden" }}
      data-match-visibility={isVisible ? "visible" : "hidden"}
    >
      {children}
    </div>
  );
}
