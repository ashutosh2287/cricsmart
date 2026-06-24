"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { countUp } from "./motion";

type Props = {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  color?: "cyan" | "green" | "purple" | "amber";
};

const colorMap = {
  cyan: "text-[var(--brand)]",
  green: "text-[var(--success)]",
  purple: "text-[var(--accent)]",
  amber: "text-[var(--amber)]",
};

export default function StatCounter({
  value,
  label,
  suffix = "",
  prefix = "",
  icon,
  color = "cyan",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      variants={countUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="text-center"
    >
      {icon && (
        <div className={`text-2xl mb-2 ${colorMap[color]}`}>{icon}</div>
      )}
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]} tabular-nums`}>
        {prefix}{display.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-[var(--text-2)] mt-1 font-medium">{label}</div>
    </motion.div>
  );
}
