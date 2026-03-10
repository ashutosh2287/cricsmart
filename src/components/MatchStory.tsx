"use client";

import { generateMatchStory, MatchStory as MatchStoryType } from "@/services/story/matchStoryEngine";

type Props = {
  matchId: string;
};

export default function MatchStory({ matchId }: Props) {

  const story: MatchStoryType = generateMatchStory(matchId);

  if (!story) return null;

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl space-y-3">

      <h2 className="font-bold text-lg">Match Story</h2>

      {story.turningPoint && (
        <p>
          <b>Turning Point:</b> {story.turningPoint}
        </p>
      )}

      {story.partnership && (
        <p>
          <b>Key Partnership:</b> {story.partnership}
        </p>
      )}

      {story.bestMoment && (
        <p>
          <b>Best Moment:</b> {story.bestMoment}
        </p>
      )}

    </div>
  );
}