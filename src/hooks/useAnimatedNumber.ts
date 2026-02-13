import { useEffect, useState } from "react";

export function useAnimatedNumber(target: number, duration = 400) {

  const [value, setValue] = useState(target);

  useEffect(() => {

    let start: number | null = null;
    const initial = value;
    const diff = target - initial;

    if (diff === 0) return;

    function animate(timestamp: number) {

      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / duration, 1);

      const nextValue = Math.round(initial + diff * progress);

      setValue(nextValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }

    }

    requestAnimationFrame(animate);

  }, [target]);

  return value;

}
