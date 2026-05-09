"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
};

export default function AnimatedDigit({ value }: Props) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    if (displayRef.current === value) return;
    let frameId: number | null = null;

    const step = () => {
      if (displayRef.current === value) return;
      const next = displayRef.current < value ? displayRef.current + 1 : displayRef.current - 1;
      displayRef.current = next;
      setDisplay(next);
      if (next !== value) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return (
    <span className="inline-block transition-all">
      {display}
    </span>
  );
}
