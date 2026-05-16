"use client";

import React from "react";

type MatchVisibilityGuardProps = {
  children: React.ReactNode;
  isVisible: boolean;
  keepMounted?: boolean;
  className?: string;
};

export default function MatchVisibilityGuard({
  children,
  isVisible,
  keepMounted = false,
  className,
}: MatchVisibilityGuardProps) {
  if (!isVisible && !keepMounted) return null;

  return (
    <div className={!isVisible ? className : undefined}>
      {children}
    </div>
  );
}