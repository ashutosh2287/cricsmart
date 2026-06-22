"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeStadiumMoment } from "@/services/stadiumMoment";

const EFFECT_CONFIG: Record<string, { color: string; intensity: number; duration: number }> = {
  SIX: { color: "rgba(34, 197, 94, 0.4)", intensity: 0.6, duration: 800 },
  FOUR: { color: "rgba(59, 130, 246, 0.35)", intensity: 0.5, duration: 600 },
  WICKET: { color: "rgba(239, 68, 68, 0.45)", intensity: 0.7, duration: 700 },
  CATCH: { color: "rgba(168, 85, 247, 0.35)", intensity: 0.4, duration: 500 },
  OVER: { color: "var(--surface-3)", intensity: 0.2, duration: 400 },
};

export default function StadiumOverlay() {
  const [effect, setEffect] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const unsub = subscribeStadiumMoment((moment) => {
      setEffect(moment);
      setKey((k) => k + 1);
    });

    return unsub;
  }, []);

  const config = effect ? EFFECT_CONFIG[effect] || EFFECT_CONFIG.OVER : null;

  return (
    <AnimatePresence>
      {effect && config && (
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, config.intensity, config.intensity * 0.6, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: config.duration / 1000, ease: "easeOut" }}
          className={`stadium-overlay fixed inset-0 pointer-events-none z-40 ${effect.toLowerCase()}`}
          style={{
            background: `radial-gradient(ellipse at center, ${config.color} 0%, transparent 70%)`,
          }}
        />

      )}
    </AnimatePresence>
  );
}
