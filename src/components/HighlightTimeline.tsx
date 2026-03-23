"use client";

import { useEffect, useRef, useState } from "react";
import {
  getHighlights,
  subscribeHighlights,
  Highlight
} from "@/services/highlights/highlightStore";

type Props = {
  matchId: string;
};

export default function HighlightTimeline({ matchId }: Props) {

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const update = (id: string) => {
      if (id !== matchId) return;

      const data = getHighlights(matchId);
      setHighlights([...data]);
    };

    const unsubscribe = subscribeHighlights(update);

    update(matchId);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  // 🔥 AUTO SCROLL
  useEffect(() => {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }
}, [highlights]);

  if (!highlights.length) return null;

  return (
    <div className="backdrop-blur-md bg-white/5 
                border border-white/10 
                text-white rounded-xl p-3">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">

        <h3 className="text-sm font-semibold text-gray-300 uppercase">
          Match Highlights
        </h3>

        <span className="text-xs text-gray-500">
          Live
        </span>

      </div>

      {/* LIST */}
      <div
        ref={containerRef}
        className="h-[320px] overflow-y-auto space-y-2 pr-1 
           scrollbar-thin scrollbar-thumb-gray-600 
           scrollbar-track-transparent"
      >

        {highlights.slice(-25).map((h, i) => (
          <div
            key={h.id}
            className="flex items-center justify-between 
                       bg-zinc-900/80 hover:bg-zinc-800 
                       px-3 py-2 rounded-md 
                       transition text-sm"
          >

            {/* LEFT */}
            <div className="flex items-center gap-2">

              <span className="text-lg">
                {getIcon(h.type)}
              </span>

              <span className={`${getColor(h.type)} font-medium`}>
                {formatText(h.type)}
              </span>

            </div>

            {/* RIGHT (index/time feel) */}
            <span className="text-[10px] text-gray-500">
              #{highlights.length - i}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}

/* ==============================
   ICONS
============================== */

function getIcon(type: string) {

  switch (type) {

    case "WICKET":
      return "🎯";

    case "SIX":
      return "⚡";

    case "HAT_TRICK_THREAT":
      return "🔥";

    case "BOUNDARY_CLUSTER":
      return "💥";

    case "LAST_OVER_THRILLER":
      return "🚨";

    case "BIG_PARTNERSHIP":
      return "🤝";

    case "DOMINANT_PARTNERSHIP":
      return "👑";

    default:
      return "•";
  }

}

/* ==============================
   COLORS
============================== */

function getColor(type: string) {

  switch (type) {

    case "WICKET":
      return "text-red-400";

    case "SIX":
      return "text-green-400";

    case "BOUNDARY_CLUSTER":
      return "text-blue-400";

    case "LAST_OVER_THRILLER":
      return "text-yellow-400";

    case "DOMINANT_PARTNERSHIP":
      return "text-purple-400";

    default:
      return "text-gray-300";
  }

}

/* ==============================
   TEXT FORMAT
============================== */

function formatText(type: string) {

  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

}