"use client";

import { useEffect, useState } from "react";
import { subscribeAnimation } from "@/services/animationBus";

type Particle = {
  id: number;
  tx: number;
  ty: number;
  delay: number;
};

export default function BroadcastOverlay() {

  const [event, setEvent] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {

    const unsubscribe = subscribeAnimation((e) => {

      setEvent(e.type);

      if (e.type === "SIX") {

        // ⭐ SCREEN SHAKE
        setShake(true);
        setTimeout(() => setShake(false), 400);

        // ⭐ FLASH EFFECT
        setFlash(true);
        setTimeout(() => setFlash(false), 150);

        // ⭐ GPU PARTICLES
        const newParticles: Particle[] = Array.from({ length: 30 }).map((_, i) => {

          const angle = Math.random() * 360;
          const distance = 150 + Math.random() * 150;
          const radians = (angle * Math.PI) / 180;

          return {
            id: i,
            tx: Math.cos(radians) * distance,
            ty: Math.sin(radians) * distance,
            delay: Math.random() * 0.2,
          };

        });

        setParticles(newParticles);

      }

      setTimeout(() => {
        setEvent(null);
        setParticles([]);
      }, 1200);

    });

    return unsubscribe;

  }, []);

  if (!event) return null;

  return (

    <div
      className={`
        fixed inset-0 pointer-events-none z-50
        flex items-center justify-center overflow-hidden
        ${shake ? "animate-[shake_0.4s]" : ""}
      `}
    >

      {/* FLASH OVERLAY */}
      {flash && (
        <div className="absolute inset-0 bg-white opacity-70 animate-pulse"/>
      )}

      {/* CINEMATIC TEXT */}
      <div className="text-6xl font-extrabold animate-bounce z-10">

        {event === "SIX" && "🔥 SIX 🔥"}
        {event === "FOUR" && "⚡ FOUR ⚡"}
        {event === "WICKET" && "💀 WICKET 💀"}

      </div>

      {/* GPU PARTICLES */}
      {event === "SIX" && particles.map(p => (

        <span
          key={p.id}
          className="particle"
          style={{
            animationDelay: `${p.delay}s`,
            transform: `translate(-50%, -50%) translate3d(${p.tx}px, ${p.ty}px, 0)`
          }}
        />

      ))}

    </div>

  );

}
