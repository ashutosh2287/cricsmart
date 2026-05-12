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
    <div className="bg-gray-900 p-4 rounded-xl">

      {/* 🔥 INSIGHTS */}
      {insights && insights.length > 0 && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <div className="text-xs text-yellow-400 font-semibold mb-1">
            Match Insights
          </div>

          {insights.map((i, idx) => (
            <div key={idx} className="text-xs text-yellow-300">
              {i.message}
            </div>
          ))}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Live Commentary</h3>

        <button
          onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
          className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
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
          <div className="text-gray-500 text-sm">
            Waiting for commentary...
          </div>
        )}

        {Object.entries(grouped).map(([over, balls]) => (
          <div key={over} className="mb-3">

            <div className="text-xs text-gray-400 mb-1">
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
                  className="border-b border-gray-800 pb-2 px-2 py-1 rounded"
                >
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ball {msg.index + 1}</span>

                    {isBoundary && (
                      <span className="text-green-400 font-bold">
                        BOUNDARY
                      </span>
                    )}

                    {isWicket && (
                      <span className="text-red-400 font-bold">
                        WICKET
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-gray-200">
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