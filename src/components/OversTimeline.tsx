"use client";

import { useEffect, useState } from "react";
import { subscribeTimeline } from "@/services/broadcastTimeline";
import { BallEvent } from "@/types/ballEvent";

type Props = {
  slug: string;
};

export default function OversTimeline({ slug }: Props) {

  const [events, setEvents] = useState<BallEvent[]>([]);

  // ⭐ Track newest ball
  const [latestEventKey, setLatestEventKey] = useState<string | null>(null);

  /*
  =====================================
  🔥 TIMELINE STREAM SUBSCRIPTION
  =====================================
  */

  useEffect(() => {

    const unsubscribe = subscribeTimeline((event) => {

      if (event.slug !== slug) return;

      setEvents(prev => [...prev, event]);

      // unique id for newest ball
      setLatestEventKey(`${event.over}-${event.timestamp}`);

    });

    return unsubscribe;

  }, [slug]);

  /*
  =====================================
  🔥 GROUP BALLS BY OVER
  =====================================
  */

  const grouped = events.reduce<Record<number, BallEvent[]>>((acc, e) => {

    const overNumber = Math.floor(Number(e.over));

    if (!acc[overNumber]) {
      acc[overNumber] = [];
    }

    acc[overNumber].push(e);

    return acc;

  }, {});

  const overs = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4">

      {overs.map((over) => {

        const balls = grouped[over];

        const overRuns = balls.reduce((sum, ball) => {
          return sum + (ball.runs ?? 0);
        }, 0);

        return (

          <div key={over} className="border p-4 rounded-lg">

            {/* OVER HEADER */}
            <h3 className="font-bold mb-3 flex justify-between">

              <span>Ov {over}</span>

              <span className="text-gray-400">
                {overRuns} runs
              </span>

            </h3>

            {/* BALL ROW */}
            <div className="flex gap-2 flex-wrap">

              {balls.map((ball, i) => {

                const label =
                  ball.wicket ? "W"
                  : ball.runs === 0 ? "•"
                  : ball.runs;

                const color =
                  ball.wicket
                    ? "bg-red-500 text-white"
                    : ball.runs === 4
                    ? "bg-blue-500 text-white"
                    : ball.runs === 6
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-black";

                // ⭐ Animate ONLY newest ball
                const isLatestBall =
                  latestEventKey === `${ball.over}-${ball.timestamp}`;

                return (
                  <div
                    key={i}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      transition-all duration-300
                      ${color}
                      ${isLatestBall ? "animate-bounce scale-110" : ""}
                    `}
                  >
                    {label}
                  </div>
                );

              })}

            </div>

          </div>

        );

      })}

    </div>
  );
}
