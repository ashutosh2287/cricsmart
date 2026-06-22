"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  label?: string;
  className?: string;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 2000, label, className = "" }: AnimatedCounterProps) {
  const { ref, display } = useCountUp({
    end: value,
    duration,
    startOnView: true,
    prefix,
    suffix,
  });

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-1)",
          lineHeight: 1,
        }}
      >
        {display}
      </div>
      {label && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            marginTop: 4,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
