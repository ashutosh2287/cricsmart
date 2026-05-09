"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
};

export default function AnimatedDigit({ value }: Props) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      let done = false;
      setDisplay((prev) => {
        if (prev === value) {
          done = true;
          return prev;
        }
        const next = prev < value ? prev + 1 : prev - 1;
        if (next === value) done = true;
        return next;
      });
      if (done) clearInterval(interval);
    }, 30); // speed of flip

    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className="inline-block transition-all">
      {display}
    </span>
  );
}
