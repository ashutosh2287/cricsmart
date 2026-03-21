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
  const [threat, setThreat] = useState<"LOW" | "BUILDING" | "DANGEROUS" | "MATCH_CHANGING">("LOW");
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");

  useEffect(() => {

    const update = () => {

      const p = computeCurrentPartnership(matchId);

      if (!p) return;

      setRuns(p.runs);
      setBalls(p.balls);
      setRR(p.runRate);
      setThreat(p.threat);
      setStriker(p.striker ?? "");
      setNonStriker(p.nonStriker ?? "");

    };

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  return (

  <div className="bg-gradient-to-br from-[#020617] to-[#0f172a] text-white p-5 rounded-xl border border-gray-800 shadow-lg">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-3">
      <div>
  <h3 className="text-sm uppercase text-gray-400 tracking-wide">
    Current Partnership
  </h3>

  <div className="text-lg font-semibold text-white mt-1">
    ⭐ {striker || "—"} & {nonStriker || "—"}
  </div>

  <div className="text-xs text-gray-400">
    {runs} ({balls})
  </div>
</div>

      {/* 🔥 THREAT BADGE */}
      <div
        className={`text-xs px-2 py-1 rounded-full font-semibold ${
          threat === "LOW"
            ? "bg-gray-700 text-gray-300"
            : threat === "BUILDING"
            ? "bg-blue-500/20 text-blue-400"
            : threat === "DANGEROUS"
            ? "bg-orange-500/20 text-orange-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {threat === "LOW" && "⚪ LOW"}
        {threat === "BUILDING" && "⚠️ BUILDING"}
        {threat === "DANGEROUS" && "🔥 DANGEROUS"}
        {threat === "MATCH_CHANGING" && "🚨 MATCH"}
      </div>
    </div>

    {/* MAIN NUMBERS */}
    <div className="flex justify-between items-end">

      {/* RUNS */}
      <div>
        <div className="text-3xl font-bold text-white">
          {runs}
        </div>
        <div className="text-xs text-gray-400">Runs</div>
      </div>

      {/* BALLS */}
      <div className="text-center">
        <div className="text-xl font-semibold text-gray-200">
          {balls}
        </div>
        <div className="text-xs text-gray-400">Balls</div>
      </div>

      {/* RUN RATE */}
      <div className="text-right">
        <div className="text-xl font-semibold text-green-400">
          {rr.toFixed(2)}
        </div>
        <div className="text-xs text-gray-400">Run Rate</div>
      </div>

    </div>

    {/* 🔥 VISUAL BAR (BONUS FEEL) */}
    <div className="mt-4 h-2 w-full bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          threat === "LOW"
            ? "bg-gray-500 w-[20%]"
            : threat === "BUILDING"
            ? "bg-blue-500 w-[50%]"
            : threat === "DANGEROUS"
            ? "bg-orange-500 w-[75%]"
            : "bg-red-500 w-full"
        }`}
      />
    </div>

  </div>

);

}