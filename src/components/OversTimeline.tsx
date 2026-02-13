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

  // 🔥 Detect new ball outside render
  const [isNewEvent, setIsNewEvent] = useState(false);

  useEffect(() => {

    const unsubscribe = subscribeBallEvents(() => {

      const newEvents = getBallEvents(slug);

      if (newEvents.length > prevLength.current) {
        setIsNewEvent(true);

        setTimeout(() => setIsNewEvent(false), 400);
      }

      prevLength.current = newEvents.length;

      setEvents([...newEvents]);

    });

    return unsubscribe;

  }, [slug]);

  // ⭐ GROUP BALLS BY OVER
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

        const overRuns = grouped[over].reduce((sum, ball) => {
          return sum + (ball.runs || 0);
        }, 0);

        return (

          <div key={over} className="border p-4 rounded-lg">

            <h3 className="font-bold mb-2">
              Ov {over} — {overRuns} runs
            </h3>

            <div className="flex gap-2">

              {grouped[over].map((ball, i) => {

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
                    : "bg-gray-300";

                const isLatestBall =
                  i === grouped[over].length - 1 && isNewEvent;

                return (
                  <div
                    key={i}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
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
