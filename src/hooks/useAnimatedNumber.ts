import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const durationRef = useRef(duration);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    let frameId: number | null = null;
    let cancelled = false;
    let start: number | null = null;
    const initial = valueRef.current;
    const diff = target - initial;

    if (diff === 0) return;

    function animate(timestamp: number) {
      if (cancelled) return;
      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / durationRef.current, 1);
      const nextValue = Math.round(initial + diff * progress);
      valueRef.current = nextValue;
      setValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [target]);

  return value;
}
