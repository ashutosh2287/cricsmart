"use client";

import { useEffect, useState } from "react";
import { subscribeDirector } from "@/services/broadcastDirector";

export default function BroadcastDirectorOverlay() {

  const [effect, setEffect] = useState<string | null>(null);

  useEffect(() => {

    const unsub = subscribeDirector((e) => {

      setEffect(e);

      setTimeout(() => setEffect(null), 600);

    });

    return unsub;

  }, []);

  if (!effect) return null;

  return (
    <div className={`director-overlay ${effect.toLowerCase()}`} />
  );
}
