"use client";

import React from "react";
import {
  getTierFromState,
  importanceTierClassMap,
  type LiveEnergyState,
} from "@/animations/live-energy";

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type LiveEnergyWrapperProps = {
  children: React.ReactNode;
  state?: LiveEnergyState;
  enabled?: boolean;
  className?: string;
};

export default function LiveEnergyWrapper({
  children,
  state = "regular",
  enabled = true,
  className,
}: LiveEnergyWrapperProps) {
  const tier = getTierFromState(state);
  const tierClasses = importanceTierClassMap[tier];

  return (
    <div
      data-motion-layer="live-energy"
      className={cls(
        "relative",
        className,
        enabled && tierClasses.glowClass,
        enabled && tierClasses.animationClass
      )}
    >
      {children}
    </div>
  );
}