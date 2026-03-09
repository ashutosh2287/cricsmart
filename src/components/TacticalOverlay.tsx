"use client";

import { useEffect, useState } from "react";
import { subscribeOverlay } from "@/services/overlayBus";

type OverlayState = {
  text: string;
  color: string;
};

export default function TacticalOverlay() {

  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  useEffect(() => {

    const unsubscribe = subscribeOverlay(event => {

      const map: Record<string, OverlayState> = {
  TACTICAL_COLLAPSE: {
    text: "⚠ COLLAPSE ALERT",
    color: "bg-red-600"
  },

  TACTICAL_ASSAULT: {
    text: "🔥 ASSAULT PHASE",
    color: "bg-orange-500"
  },

  TACTICAL_STRANGLE: {
    text: "🧊 STRANGLE HOLD",
    color: "bg-blue-600"
  },

  TACTICAL_PANIC: {
    text: "😰 PANIC MODE",
    color: "bg-yellow-500 text-black"
  },

  TACTICAL_RECOVERY: {
    text: "🛡 RECOVERY PHASE",
    color: "bg-green-600"
  },
  LAST_OVER_THRILLER: {
  text: "🔥 LAST OVER THRILLER",
  color: "bg-red-700"
},
TURNING_POINT: {
  text: "⚡ TURNING POINT",
  color: "bg-indigo-600"
},

  /*
  --------------------------------------
  HIGHLIGHT OVERLAYS
  --------------------------------------
  */

  HAT_TRICK_THREAT: {
    text: "🎯 HAT-TRICK BALL!",
    color: "bg-purple-600"
  },

  BOUNDARY_CLUSTER: {
    text: "💥 BOUNDARY BARRAGE",
    color: "bg-pink-600"
  }
};

      const data = map[event.type];

      if (!data) return;

      setOverlay(data);

      setTimeout(() => {
        setOverlay(null);
      }, 3500);

    });

    return () => {
  unsubscribe();
};

  }, []);

  if (!overlay) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2
      px-6 py-2 rounded-xl shadow-xl font-semibold text-sm
      animate-overlaySlide ${overlay.color}`}
    >
      {overlay.text}
    </div>
  );
}