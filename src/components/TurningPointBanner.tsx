"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeMatch } from "@/services/matchEngine";
import { detectTurningPoints } from "@/services/analytics/turningPointEngine";
import { getEventStream } from "@/services/matchEngine";

type Props = {
  matchId: string;
};

export default function TurningPointBanner({ matchId }: Props) {
  const [turn, setTurn] = useState<number | null>(null);
  const prevTurnRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const events = getEventStream(matchId);
      const turningPoints = detectTurningPoints(events);

      if (!turningPoints.length) {
        setTurn(null);
        prevTurnRef.current = null;
        return;
      }

      const latest = turningPoints[turningPoints.length - 1];
      const idx = latest.ballIndex;

      if (idx !== prevTurnRef.current) {
        setTurn(idx);
        prevTurnRef.current = idx;

        setTimeout(() => {
          setTurn(null);
        }, 5000);
      }
    };

    const unsubscribe = subscribeMatch(matchId, update);
    return () => unsubscribe();
  }, [matchId]);

  if (!turn) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      🎯 Turning Point – Ball {turn}
    </div>
  );
}
