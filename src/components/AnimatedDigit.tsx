"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
};

export default function AnimatedDigit({ value }: Props) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (displayRef.current === value) return;
    let rafId = 0;
    let current = displayRef.current;
    const step = () => {
      if (current === value) return;
      current += current < value ? 1 : -1;
      setDisplay(current);
      rafId = window.setTimeout(step, 26);
    };
    step();
    return () => clearTimeout(rafId);
  }, [value]);

  return (
    <span className="inline-block transition-all">
      {display}
    </span>
  );
}
