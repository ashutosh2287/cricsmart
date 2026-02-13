"use client";

import { useEffect, useState } from "react";
import { subscribeCommentary, Commentary } from "@/services/commentaryBus";

export default function LiveCommentaryFeed() {

  const [comments, setComments] = useState<Commentary[]>([]);

  useEffect(() => {

    const unsub = subscribeCommentary((c) => {

      setComments(prev => [c, ...prev].slice(0, 10));

    });

    return unsub;

  }, []);

  return (
    <div className="space-y-2 border p-4 rounded-lg">

      <h3 className="font-bold">Live Commentary</h3>

      {comments.map((c, i) => (
        <p key={i} className="text-sm">
          {c.text}
        </p>
      ))}

    </div>
  );
}
