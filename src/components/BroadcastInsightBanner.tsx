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
            color: "var(--danger)"
          };
          break;

        case "ASSAULT_PHASE":
          message = {
            text: "🚀 ASSAULT PHASE",
            color: "var(--success)"
          };
          break;

        case "STRANGLE_ALERT":
          message = {
            text: "🎯 STRANGLE HOLD",
            color: "var(--amber)"
          };
          break;

        case "PANIC_MODE":
          message = {
            text: "⚠ PANIC MODE",
            color: "var(--amber)"
          };
          break;

        case "RECOVERY_PHASE":
          message = {
            text: "🧊 RECOVERY PHASE",
            color: "var(--brand)"
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
      className="absolute top-6 left-1/2 -translate-x-1/2 z-40"
      style={{ background: banner.color }}
    >
      {banner.text}
    </div>

  );

}