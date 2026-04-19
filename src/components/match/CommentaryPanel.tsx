"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeCommentary, getCommentary } from "@/services/commentary/commentaryBus";
import { getTimeline } from "@/services/broadcastTimeline";
import { scrubToPosition } from "@/services/replayController";
import { translateCommentary } from "@/services/commentary/commentaryTranslator";
import TypingText from "../ui/TypingText";

type Commentary = {
  matchId: string;
  text: string;
  eventId: string;
  category: "BALL" | "INSIGHT";
};

export default function CommentaryPanel({ matchId }: { matchId: string }) {

  const [messages, setMessages] = useState<Commentary[]>(() =>
    getCommentary(matchId)
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  /* =============================
     SUBSCRIBE REALTIME
  ============================= */
  useEffect(() => {
    const unsubscribe = subscribeCommentary((c) => {
      if (c.matchId !== matchId) return;

      setMessages(prev => {
        if (prev.some(p => p.eventId === c.eventId)) {
          return prev;
        }
        return [...prev, c];
      });
    });

    return () => unsubscribe();
  }, [matchId]);

  /* =============================
     RESET ON MATCH CHANGE
  ============================= */
  useEffect(() => {
    setMessages(getCommentary(matchId));
  }, [matchId]);

  /* =============================
     SCROLL
  ============================= */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: messages.length < 5 ? "auto" : "smooth"
      });
    }
  }, [messages]);

  /* =============================
     JUMP TO BALL
  ============================= */
  function handleJump(eventId: string) {
    const timeline = getTimeline(matchId);
    const index = timeline.findIndex(e => e.id === eventId);

    if (index === -1) return;

    scrubToPosition(matchId, index);
  }

  /* =============================
     GROUP BY OVER (SIMPLE)
  ============================= */
  const grouped = messages.reduce((acc, msg, index) => {
    const over = Math.floor(index / 6);

    if (!acc[over]) acc[over] = [];
    acc[over].push({ ...msg, index });

    return acc;
  }, {} as Record<number, (Commentary & { index: number })[]>);

  const latestEventId = messages.length
  ? messages[messages.length - 1].eventId
  : null;

  return (
    <div className="bg-gray-900 p-4 rounded-xl">


      <div className="flex justify-between items-center mb-2">
  <h3 className="font-bold">Live Commentary</h3>

  <button
    onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
    className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
  >
    {lang === "EN" ? "हिंदी" : "English"}
  </button>
</div>

      <div
        ref={containerRef}
        className="h-[250px] overflow-y-auto text-sm"
      >

        {Object.entries(grouped).map(([over, balls]) => (

          <div key={over} className="mb-3">

            {/* 🔥 OVER HEADER */}
            <div className="text-xs text-gray-400 mb-1">
              Over {Number(over) + 1}
            </div>

            {/* 🔥 BALLS */}
            {balls.map((msg, i) => {

              const isBoundary =
                msg.text.includes("FOUR") || msg.text.includes("SIX");

              const isWicket =
                msg.text.includes("OUT") || msg.text.includes("WICKET");

              return (
                <div
                  key={`${msg.eventId}-${i}`}
                  onClick={() => handleJump(msg.eventId)}
                  className="border-b border-gray-800 pb-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition animate-[fadeInUp_0.35s_ease]"
                >

                  {/* HEADER */}
                  <div className="flex items-center justify-between">

                    <span className="text-xs text-gray-500">
                      Ball {msg.index + 1}
                    </span>

                    {isBoundary && (
                      <span className="text-green-400 text-xs font-bold">
                        BOUNDARY
                      </span>
                    )}

                    {isWicket && (
                      <span className="text-red-400 text-xs font-bold">
                        WICKET
                      </span>
                    )}

                  </div>

                  {/* TEXT */}
                  <div
  className={`text-sm mt-1 leading-relaxed
    ${isWicket ? "text-red-400" : ""}
    ${isBoundary ? "text-green-300" : "text-gray-200"}
  `}
>
  {msg.eventId === latestEventId ? (
    <TypingText text={translateCommentary(msg.text, lang)} />
  ) : (
    translateCommentary(msg.text, lang)
  )}
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