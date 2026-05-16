import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let rafId = 0;
    let start: number | null = null;
    const initial = valueRef.current;
    const diff = target - initial;

    if (diff === 0) return;

    function animate(timestamp: number) {

      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / Math.max(duration, 1), 1);

      const nextValue = Math.round(initial + diff * progress);

      setValue(nextValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}
