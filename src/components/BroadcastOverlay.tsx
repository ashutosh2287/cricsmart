"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeAnimation } from "@/services/animationBus";

type Particle = {
  id: number;
  tx: number;
  ty: number;
  delay: number;
  size: number;
};

const EVENT_STYLES: Record<string, { emoji: string; color: string; bg: string }> = {
  SIX: { emoji: "🔥", color: "var(--brand)", bg: "rgba(34, 197, 94, 0.3)" },
  FOUR: { emoji: "⚡", color: "var(--text-1)", bg: "rgba(59, 130, 246, 0.2)" },
  WICKET: { emoji: "💀", color: "var(--danger)", bg: "rgba(239, 68, 68, 0.25)" },
};

export default function BroadcastOverlay() {
  const [event, setEvent] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeAnimation((e) => {
      setEvent(e.type);
      setKey((k) => k + 1);

      if (e.type === "SIX") {
        const newParticles: Particle[] = Array.from({ length: 30 }).map((_, i) => {
          const angle = Math.random() * 360;
          const distance = 150 + Math.random() * 150;
          const radians = (angle * Math.PI) / 180;

          return {
            id: i,
            tx: Math.cos(radians) * distance,
            ty: Math.sin(radians) * distance,
            delay: Math.random() * 0.2,
            size: 4 + Math.random() * 6,
          };
        });

        setParticles(newParticles);
      }

      setTimeout(() => {
        setEvent(null);
        setParticles([]);
      }, 1500);
    });

    return unsubscribe;
  }, []);

  const style = event ? EVENT_STYLES[event] : null;

  return (
    <AnimatePresence>
      {event && style && (
        <motion.div
          key={key}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Background radial flash */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.5 }}
            style={{
              background: `radial-gradient(circle at center, ${style.bg} 0%, transparent 60%)`,
            }}
          />

          {/* Screen shake container */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={
              event === "SIX"
                ? { x: [0, -6, 8, -4, 6, -2, 0], y: [0, 4, -6, 3, -5, 2, 0] }
                : event === "WICKET"
                ? { x: [0, -3, 5, -3, 0], y: [0, 2, -4, 2, 0] }
                : {}
            }
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Cinematic text */}
            <motion.div
              className="text-6xl font-extrabold z-10"
              initial={{ scale: 0.3, opacity: 0, rotateZ: -10 }}
              animate={{
                scale: [0.3, 1.2, 1],
                opacity: [0, 1, 1],
                rotateZ: [-10, 5, 0],
              }}
              exit={{ scale: 0.8, opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                color: style.color,
                textShadow: `0 0 30px ${style.bg}, 0 0 60px ${style.bg}`,
              }}
            >
              {style.emoji} {event} {style.emoji}
            </motion.div>
          </motion.div>

          {/* GPU particles for SIX */}
          {event === "SIX" &&
            particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: style.color,
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: p.tx,
                  y: p.ty,
                  opacity: [1, 1, 0],
                  scale: [1, 1.5, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}

          {/* Ripple ring for WICKET */}
          {event === "WICKET" && (
            <>
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{ borderColor: style.color, left: "50%", top: "50%" }}
                  initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.8 }}
                  animate={{
                    width: 300,
                    height: 300,
                    x: -150,
                    y: -150,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.8, delay, ease: "easeOut" }}
                />
              ))}
            </>
          )}

          {/* Speed lines for FOUR */}
          {event === "FOUR" && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.4 }}
              style={{
                background: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 20px,
                  ${style.bg} 20px,
                  ${style.bg} 22px
                )`,
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
