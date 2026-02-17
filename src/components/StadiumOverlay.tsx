"use client";

import { useEffect, useState } from "react";
import { subscribeStadiumMoment } from "@/services/stadiumMoment";

export default function StadiumOverlay() {

  const [effect, setEffect] = useState<string | null>(null);

  useEffect(() => {

    const unsub = subscribeStadiumMoment((moment) => {

      setEffect(moment);

      setTimeout(() => setEffect(null), 500);

    });

    return unsub;

  }, []);

  if (!effect) return null;

  return (
    <div className={`stadium-overlay ${effect.toLowerCase()}`} />
  );
}
