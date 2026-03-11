"use client";

import { useEffect, useState } from "react";
import { subscribeMatch, getEventStream } from "@/services/matchEngine";
import {
  buildNarrativeTimeline,
  NarrativeSegment
} from "@/services/narrative/narrativeTimelineEngine";

type Props = {
  matchId: string;
};

export default function NarrativeTimeline({ matchId }: Props) {

  const [segments, setSegments] = useState<NarrativeSegment[]>([]);

  useEffect(() => {

    function update() {

      const events = getEventStream(matchId);

      const inputs = events.map((e, i) => ({
        momentum: 0,
        pressure: 0,
        winProbability: 0.5,
        wickets: e.wicket ? 1 : 0,
        over: e.over,
        ballNumber: i
      }));

      const timeline = buildNarrativeTimeline(inputs);

      setSegments(timeline.segments);

    }

    update();

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
  unsubscribe();
};

  }, [matchId]);

  if (!segments.length) return null;

  return (

    <div className="bg-zinc-900 text-white p-3 rounded-lg">

      <h3 className="text-sm font-semibold mb-2">
        Match Narrative
      </h3>

      <div className="flex gap-2 overflow-x-auto">

        {segments.map((s, i) => (
          <div
            key={i}
            className="px-3 py-1 text-xs bg-purple-600 rounded"
          >
            {s.phase}
          </div>
        ))}

      </div>

    </div>

  );

}