"use client";

import { memo, useCallback, useEffect, useState, useRef } from "react";
import { subscribeCommentary, Commentary } from "@/services/commentary/commentaryBus";

function LiveCommentaryFeed() {

  const [comments, setComments] = useState<Commentary[]>([]);
  const mounted = useRef(false);
  const handleCommentary = useCallback((c: Commentary) => {
    if (!mounted.current) return;

    setComments((prev) => {
      const updated = [c, ...prev];
      return updated.slice(0, 15);
    });
  }, []);

  useEffect(() => {

    mounted.current = true;

    const unsub = subscribeCommentary(handleCommentary);

    return () => {
      mounted.current = false;
      unsub();
    };

  }, [handleCommentary]);

  return (
    <div className="space-y-2 border p-4 rounded-lg h-[250px] overflow-y-auto">

      <h3 className="font-bold text-sm text-gray-400 mb-2">
        Live Commentary
      </h3>

      {comments.length === 0 && (
        <p className="text-gray-500 text-sm">
          Waiting for commentary...
        </p>
      )}

      {comments.map((c, i) => (
        <p key={i} className="text-sm text-white border-b border-gray-800 pb-1">
          {c.text}
        </p>
      ))}

    </div>
  );
}

const MemoizedLiveCommentaryFeed = memo(LiveCommentaryFeed);

MemoizedLiveCommentaryFeed.displayName = "LiveCommentaryFeed";

export default MemoizedLiveCommentaryFeed;
