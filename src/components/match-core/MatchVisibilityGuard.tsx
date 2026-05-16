"use client";

import React from "react";

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MatchVisibilityGuardProps = {
  isVisible: boolean;
  keepMounted?: boolean;
  hiddenClassName?: string;
  className?: string;
  children: React.ReactNode;
};

export default function MatchVisibilityGuard({
  isVisible,
  keepMounted = true,
  hiddenClassName = "hidden",
  className,
  children,
}: MatchVisibilityGuardProps) {
  if (!isVisible && !keepMounted) return null;

  return (
    <div
      aria-hidden={!isVisible}
      data-visibility-state={isVisible ? "visible" : "hidden"}
      className={cls(className, !isVisible && hiddenClassName)}
    >
      {children}
    </div>
  );
}
