"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";
import { computeCurrentPartnership } from "@/services/analytics/partnershipEngine";

type Props = {
  matchId: string;
};

export default function PartnershipPanel({ matchId }: Props) {

  const [runs, setRuns] = useState(0);
  const [balls, setBalls] = useState(0);
  const [rr, setRR] = useState(0);

  useEffect(() => {

    const update = () => {

      const p = computeCurrentPartnership(matchId);

      if (!p) return;

      setRuns(p.runs);
      setBalls(p.balls);
      setRR(p.runRate);

    };

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  return (

    <div className="bg-black text-white p-4 rounded-xl">

      <h3 className="font-bold mb-2">
        Current Partnership
      </h3>

      <div className="text-sm space-y-1">

        <div>
          Runs: <span className="font-semibold">{runs}</span>
        </div>

        <div>
          Balls: <span className="font-semibold">{balls}</span>
        </div>

        <div>
          Run Rate: <span className="font-semibold">{rr.toFixed(2)}</span>
        </div>

      </div>

    </div>

  );

}