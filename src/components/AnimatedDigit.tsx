"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
};

export default function AnimatedDigit({ value }: Props) {

  const [display, setDisplay] = useState(value);

  useEffect(() => {

    if (display === value) return;

    let current = display;

    const interval = setInterval(() => {

      if (current === value) {
        clearInterval(interval);
        return;
      }

      current += current < value ? 1 : -1;

      setDisplay(current);

    }, 30); // speed of flip

    return () => clearInterval(interval);

  }, [value]);

  return (
    <span className="inline-block transition-all">
      {display}
    </span>
  );
}
