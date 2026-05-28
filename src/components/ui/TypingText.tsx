"use client";

import { useEffect, useState } from "react";

export default function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;

      if (i >= text.length) clearInterval(interval);
    }, 20); // speed

    return () => clearInterval(interval);
  }, [text]);

  return <p className="text-sm text-[var(--text-2)]">{displayed}</p>;
}