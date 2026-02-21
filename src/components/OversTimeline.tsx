"use client";

import { useMatchSelector } from "@/services/matchSelectors";
import { BallEvent } from "@/types/ballEvent";

type Props = {
  slug: string;
};

type OversMap = Record<number, BallEvent[]>;

export default function OversTimeline({ slug }: Props) {

  /*
  =====================================
  🔥 SINGLE SOURCE OF TRUTH
  =====================================
  */

  const oversHistory = useMatchSelector<OversMap | undefined>(
    slug,
    (m) => m.overs
  );

  if (!oversHistory) return null;

  /*
  =====================================
  🔥 SORT OVERS (LATEST FIRST)
  =====================================
  */

  const sortedOvers = Object.keys(oversHistory)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4">

      {sortedOvers.map((overNumber) => {

        const balls = oversHistory[overNumber];

        const overRuns = balls.reduce((sum, ball) => {
          return sum + (ball.runs ?? 0);
        }, 0);

        return (

          <div
            key={overNumber}
            className="border p-4 rounded-lg"
          >

            {/* OVER HEADER */}
            <h3 className="font-bold mb-3 flex justify-between">

              <span>Ov {overNumber +1}</span>

              <span className="text-gray-400">
                {overRuns} runs
              </span>

            </h3>

            {/* BALL ROW */}
            <div className="flex gap-2 flex-wrap">

            {balls.map((ball, i) => {

  /*
  -------------------------------------
  LABEL LOGIC (CRICKET CORRECT)
  -------------------------------------
  */

  let label;

  if (ball.type === "WD") {
    label = "Wd";
  } else if (ball.type === "NB") {
    label = "Nb";
  } else if (ball.wicket) {
    label = "W";
  } else if (ball.runs === 0) {
    label = "•";
  } else {
    label = ball.runs;
  }

  /*
  -------------------------------------
  COLOR LOGIC
  -------------------------------------
  */

  let color = "bg-gray-300 text-black";

  if (ball.wicket) {
    color = "bg-red-500 text-white";
  } else if (ball.type === "WD" || ball.type === "NB") {
    color = "bg-yellow-400 text-black";
  } else if (ball.runs === 4) {
    color = "bg-blue-500 text-white";
  } else if (ball.runs === 6) {
    color = "bg-green-600 text-white";
  }

  return (
    <div
      key={`${ball.timestamp}-${i}`}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold
        ${color}
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