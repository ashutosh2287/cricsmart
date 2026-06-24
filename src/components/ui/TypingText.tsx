"use client";

import { useEffect, useState } from "react";

export default function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;

      if (i >= text.length) clearInterval(interval);
    }, 20); // speed

    return () => clearInterval(interval);
  }, [text]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return <p className="text-sm text-[var(--text-2)]">{displayed}</p>;
}