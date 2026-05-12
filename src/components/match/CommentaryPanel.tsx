"use client";

import { useEffect, useRef, useState } from "react";
import { translateCommentary } from "@/services/commentary/commentaryTranslator";

type Commentary = string;

type BroadcastInsight = {
  type: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

type Props = {
  matchId: string;
  insights?: BroadcastInsight[];
};

export default function CommentaryPanel({ matchId, insights }: Props) {
  const [messages, setMessages] = useState<Commentary[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  /*
  =============================
  REALTIME SSE LISTENER (FIXED)
  =============================
  */
  useEffect(() => {
    function handleUpdate(e: Event) {
      const event = e as CustomEvent;
      const data = event.detail;

      if (!data || data.matchId !== matchId) return;
      if (data.type !== "BALL_EVENT") return;

      if (Array.isArray(data.commentary)) {
        setMessages(data.commentary);
      }
    }

    window.addEventListener("CRIC_UPDATE", handleUpdate);

    return () => {
      window.removeEventListener("CRIC_UPDATE", handleUpdate);
    };
  }, [matchId]);

  /*
  =============================
  AUTO SCROLL
  =============================
  */
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: messages.length < 5 ? "auto" : "smooth",
    });
  }, [messages]);

  /*
  =============================
  GROUP BY OVER
  =============================
  */
  const grouped = messages.reduce(
    (
      acc: Record<number, { text: string; index: number }[]>,
      msg,
      index
    ) => {
      const over = Math.floor(index / 6);

      if (!acc[over]) acc[over] = [];
      acc[over].push({ text: msg, index });

      return acc;
    },
    {}
  );

  return (
    <div className="ui-section">

      {/* 🔥 INSIGHTS */}
      {insights && insights.length > 0 && (
        <div className="mb-3 rounded-[var(--radius-sm)] border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
            Match Insights
          </div>

          {insights.map((i, idx) => (
            <div key={idx} className="text-xs text-amber-200/90">
              {i.message}
            </div>
          ))}
        </div>
      )}

      {/* HEADER */}
      <div className="ui-section-header">
        <h3 className="text-sm font-semibold text-white">Live Commentary</h3>

        <button
          onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
          className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/80 transition hover:bg-white/[0.08]"
        >
          {lang === "EN" ? "हिंदी" : "English"}
        </button>
      </div>

      {/* LIST */}
      <div
        ref={containerRef}
        className="h-[250px] overflow-y-auto text-sm"
      >
        {messages.length === 0 && (
          <div className="text-sm text-white/45">
            Waiting for commentary...
          </div>
        )}

        {Object.entries(grouped).map(([over, balls]) => (
          <div key={over} className="mb-3">

            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">
              Over {Number(over) + 1}
            </div>

            {balls.map((msg, i) => {
              const isBoundary =
                msg.text.includes("FOUR") ||
                msg.text.includes("SIX");

              const isWicket =
                msg.text.includes("OUT") ||
                msg.text.includes("WICKET");

              return (
                <div
                  key={i}
                  className="commentary-stream-item mb-1 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.02] px-2 py-1.5"
                >
                  <div className="flex justify-between text-[11px] text-white/45">
                    <span>Ball {msg.index + 1}</span>

                    {isBoundary && (
                      <span className="font-bold text-emerald-300">
                        BOUNDARY
                      </span>
                    )}

                    {isWicket && (
                      <span className="font-bold text-red-300">
                        WICKET
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-white/90">
                    {translateCommentary(msg.text, lang)}
                  </div>
                </div>
              );
            })}

          </div>
        ))}
      </div>
    </div>
  );
}
