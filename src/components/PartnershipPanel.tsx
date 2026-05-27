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

  <div
    className="p-5 rounded-xl shadow-lg"
    style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
  >

    {/* HEADER */}
    <div className="flex justify-between items-center mb-3">
      <div>
  <h3 className="text-sm uppercase text-[var(--text-3)] tracking-wide">
    Current Partnership
  </h3>

  <div className="text-lg font-semibold text-[var(--text-1)] mt-1">
    ⭐ {striker || "—"} & {nonStriker || "—"}
  </div>

  <div className="text-xs text-[var(--text-3)]">
    {runs} ({balls})
  </div>
</div>

      {/* 🔥 THREAT BADGE */}
      <div
        className={`text-xs px-2 py-1 rounded-full font-semibold ${
          threat === "LOW"
            ? "bg-[var(--surface-3)] text-[var(--text-2)]"
            : threat === "BUILDING"
            ? "bg-[var(--brand-light)] text-[var(--brand)]"
            : threat === "DANGEROUS"
            ? "bg-[var(--accent-light)] text-[var(--accent)]"
            : "bg-[var(--danger-light)] text-[var(--danger)]"
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
        <div className="text-3xl font-bold text-[var(--text-1)]">
          {runs}
        </div>
        <div className="text-xs text-[var(--text-3)]">Runs</div>
      </div>

      {/* BALLS */}
      <div className="text-center">
        <div className="text-xl font-semibold text-[var(--text-2)]">
          {balls}
        </div>
        <div className="text-xs text-[var(--text-3)]">Balls</div>
      </div>

      {/* RUN RATE */}
      <div className="text-right">
        <div className="text-xl font-semibold text-[var(--brand)]">
          {rr.toFixed(2)}
        </div>
        <div className="text-xs text-[var(--text-3)]">Run Rate</div>
      </div>

    </div>

    {/* 🔥 VISUAL BAR (BONUS FEEL) */}
    <div className="mt-4 h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
      <div
        className={`h-full transition-all duration-500 ${
          threat === "LOW"
            ? "bg-[var(--text-3)] w-[20%]"
            : threat === "BUILDING"
            ? "bg-[var(--brand)] w-[50%]"
            : threat === "DANGEROUS"
            ? "bg-[var(--accent)] w-[75%]"
            : "bg-[var(--danger)] w-full"
        }`}
      />
    </div>

  </div>

);

}
