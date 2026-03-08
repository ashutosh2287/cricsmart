"use client";

import { useEffect, useState } from "react";
import { subscribeOverlay } from "@/services/overlayBus";

export default function TacticalOverlay() {

  const [text, setText] = useState<string | null>(null);

  
  useEffect(() => {

  const unsubscribe = subscribeOverlay(event => {

    switch (event.type) {
      case "TACTICAL_COLLAPSE":
        setText("⚠️ COLLAPSE ALERT");
        break;
      case "TACTICAL_ASSAULT":
        setText("🔥 ASSAULT PHASE");
        break;
      case "TACTICAL_STRANGLE":
        setText("🧊 STRANGLE HOLD");
        break;
      case "TACTICAL_PANIC":
        setText("😰 PANIC MODE");
        break;
      case "TACTICAL_RECOVERY":
        setText("🛡️ RECOVERY PHASE");
        break;
    }

    setTimeout(() => setText(null), 4000);

  });

  return () => {
    unsubscribe();
  };

}, []);

  if (!text) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2
                    bg-black text-white px-6 py-2
                    rounded-xl shadow-lg text-sm font-semibold">
      {text}
    </div>
  );
}