"use client";

import { getMomentumTimeline } from "@/services/analytics/momentumTimelineEngine";

export default function MomentumHeatmap({ matchId }: { matchId: string }) {

  const timeline = getMomentumTimeline(matchId);

  if (!timeline.length) return null;

  function getColor(value: number) {
    if (value > 3) return "bg-green-500";
    if (value > 0) return "bg-green-300";
    if (value < -3) return "bg-red-500";
    if (value < 0) return "bg-red-300";
    return "bg-yellow-400";
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl w-full max-w-full overflow-hidden">

      <h3 className="font-bold mb-3">
        Momentum Map
      </h3>

      {/* 👇 IMPORTANT FIX */}
      <div className="flex gap-1 overflow-x-auto max-w-full">

        <div className="flex gap-[2px] min-w-max">

          {timeline.map((p, index) => (
            <div
              key={`${p.ballIndex}-${index}`}
              className={`w-2 h-10 flex-shrink-0 ${getColor(p.momentum)}`}
              title={`Ball ${p.ballIndex + 1}`}
            />
          ))}

        </div>

      </div>

    </div>
  );
}