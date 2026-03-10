"use client";

import { useEffect, useState } from "react";
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

useEffect(() => {

  const update = (id: string) => {
    if (id !== matchId) return;

    const data = getHighlights(matchId);
    setHighlights([...data]);
  };

  const unsubscribe = subscribeHighlights(update);

  // initial load
  update(matchId);

  return () => {
    unsubscribe();
  };

}, [matchId]);

  if (!highlights.length) return null;

  return (
    <div className="fixed right-5 top-20 w-64
                    bg-black text-white
                    rounded-xl shadow-xl
                    p-3 text-sm space-y-2">

      <div className="font-bold text-center border-b pb-1">
        Match Highlights
      </div>

      {highlights.slice(-10).reverse().map((h) => (
        <div
          key={h.id}
          className="flex items-center gap-2
                     border-b border-gray-700 pb-1">

          <span>{getIcon(h.type)}</span>
          <span className="text-xs">{formatText(h.type)}</span>

        </div>
      ))}

    </div>
  );
}

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

function formatText(type: string) {

  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

}