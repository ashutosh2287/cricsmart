"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeCommentary } from "@/services/commentary/commentaryStore";

export default function CommentaryPanel({ matchId }: { matchId: string }) {
  
  const [messages, setMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const unsubscribe = subscribeCommentary(matchId, (data: string[]) => {
      setMessages(data);
    });

    return () => unsubscribe();

  }, [matchId]);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-gray-900 p-4 rounded-xl">

      <h3 className="font-bold mb-3">
        Live Commentary
      </h3>

      <div
        ref={containerRef}
        className="h-[250px] overflow-y-auto space-y-2 text-sm"
      >
        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg}`} // ✅ FIX duplicate key issue also
            className="border-b border-gray-800 pb-1"
          >
            {msg}
          </div>
        ))}
      </div>

    </div>
  );
}