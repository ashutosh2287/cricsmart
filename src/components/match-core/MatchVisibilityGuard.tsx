"use client";

import React from "react";

type MatchVisibilityGuardProps = {
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
};

/**
 * Controls visibility via CSS without unmounting children from the DOM.
 */
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
