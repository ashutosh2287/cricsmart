"use client";

import { useEffect, useState } from "react";
import { subscribeDirectorSignal } from "@/services/directorSignalBus";
import { DirectorSignal } from "@/services/directorSignals";

type Banner = {
  text: string;
  color: string;
};

export default function BroadcastInsightBanner() {

  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {

    const unsubscribe = subscribeDirectorSignal((signal: DirectorSignal) => {

      let message: Banner | null = null;

      switch (signal.type) {

        case "COLLAPSE_ALERT":
          message = {
            text: "🔥 COLLAPSE ALERT",
            color: "#ef4444"
          };
          break;

        case "ASSAULT_PHASE":
          message = {
            text: "🚀 ASSAULT PHASE",
            color: "#22c55e"
          };
          break;

        case "STRANGLE_ALERT":
          message = {
            text: "🎯 STRANGLE HOLD",
            color: "#eab308"
          };
          break;

        case "PANIC_MODE":
          message = {
            text: "⚠ PANIC MODE",
            color: "#f97316"
          };
          break;

        case "RECOVERY_PHASE":
          message = {
            text: "🧊 RECOVERY PHASE",
            color: "#3b82f6"
          };
          break;

      }

      if (message) {

        setBanner(message);

        setTimeout(() => {
          setBanner(null);
        }, 4000);

      }

    });

    return () => unsubscribe();

  }, []);

  if (!banner) return null;

  return (

    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-bold text-lg z-50"
      style={{ background: banner.color }}
    >
      {banner.text}
    </div>

  );

}