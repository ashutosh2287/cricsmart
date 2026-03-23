"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeCommentary } from "@/services/commentary/commentaryBus";
import { getTimeline } from "@/services/broadcastTimeline";
import { scrubToPosition } from "@/services/replayController";
import { getCommentary } from "@/services/commentary/commentaryBus";

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

 useEffect(() => {

  const unsubscribe = subscribeCommentary((c) => {
    if (c.matchId !== matchId) return;

    setMessages(prev => {
      if (prev.some(p => p.eventId === c.eventId)) {
        return prev; // 🔥 ignore duplicate
      }
      return [...prev, c];
    });
  });

  return () => unsubscribe();

}, [matchId]);


useEffect(() => {
  setMessages(getCommentary(matchId));
}, [matchId]);

  function handleJump(eventId: string) {
    const timeline = getTimeline(matchId);
    const index = timeline.findIndex(e => e.id === eventId);

    if (index === -1) return;

    scrubToPosition(matchId, index);
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  return (
    <div className="bg-gray-900 p-4 rounded-xl">

      <h3 className="font-bold mb-3">Live Commentary</h3>

      <div
        ref={containerRef}
        className="h-[250px] overflow-y-auto space-y-2 text-sm"
      >
        {messages.map((msg, index) => (
          <div
            key={`${msg.eventId}-${index}`}
            onClick={() => handleJump(msg.eventId)}
            className="border-b border-gray-800 pb-1 cursor-pointer hover:text-blue-400"
          >
            {msg.text}
          </div>
        ))}
      </div>

    </div>
  );
}