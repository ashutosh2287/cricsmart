"use client";

import { useEffect, useRef, useState } from "react";
import { getBallEvents, subscribeBallEvents } from "@/store/ballEventStore";
import { BallEvent } from "@/types/ballEvent";

type Props = {
  slug: string;
};

export default function OversTimeline({ slug }: Props) {

  const [events, setEvents] = useState<BallEvent[]>(getBallEvents(slug));

  const prevLength = useRef(events.length);
  const [isNewEvent, setIsNewEvent] = useState(false);

  /*
  🔥 Realtime subscription
  */
  useEffect(() => {

    const unsubscribe = subscribeBallEvents(slug, () => {

      const newEvents = getBallEvents(slug);

      if (newEvents.length > prevLength.current) {
        setIsNewEvent(true);

        setTimeout(() => setIsNewEvent(false), 400);
      }

      prevLength.current = newEvents.length;

      // ⭐ IMPORTANT — create new reference
      setEvents([...newEvents]);

    });

    return unsubscribe;

  }, [slug]);

  /*
  🔥 GROUP BALLS BY OVER
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

        /*
        🔥 SAFE OVER RUN CALCULATION
        */
        const overRuns = balls.reduce((sum, ball) => {
          return sum + (ball.runs ?? 0);
        }, 0);

        return (

          <div key={over} className="border p-4 rounded-lg">

            {/* ⭐ OVER HEADER */}
            <h3 className="font-bold mb-3 flex justify-between">

              <span>Ov {over}</span>

              <span className="text-gray-400">
                {overRuns} runs
              </span>

            </h3>

            {/* ⭐ BALL ROW */}
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

                const isLatestBall =
                  i === balls.length - 1 && isNewEvent;

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
