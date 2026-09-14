import { useEffect, useState } from "react";

/**
 * An index that advances on a timer, for the looping demonstrations in the
 * features grid.
 *
 * `enabled` is what keeps the loops honest: each visual passes `false` under
 * `prefers-reduced-motion`, and the analytics chart also passes `false` while
 * somebody is driving it by hand, so an idle animation never fights a reader
 * who has taken over.
 *
 * The timer is torn down rather than merely ignored when disabled, so a page
 * left open on a reduced-motion machine schedules nothing at all.
 */
export function useCycle(length: number, intervalMs: number, enabled = true) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || length < 2) return;

    const id = setInterval(
      () => setIndex((i) => (i + 1) % length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [enabled, length, intervalMs]);

  return enabled ? index : -1;
}

/**
 * The same, but walking to the end and back rather than snapping to the start.
 *
 * A wrapping index makes a marker sweeping a line fly backwards across the
 * whole chart every cycle, which reads as a glitch. Reversing at each end
 * keeps it a sweep.
 */
export function usePingPong(length: number, intervalMs: number, enabled = true) {
  const [state, setState] = useState({ index: 0, step: 1 });

  useEffect(() => {
    if (!enabled || length < 2) return;

    const id = setInterval(() => {
      setState(({ index, step }) => {
        const next = index + step;
        if (next >= length - 1) return { index: length - 1, step: -1 };
        if (next <= 0) return { index: 0, step: 1 };
        return { index: next, step };
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, length, intervalMs]);

  return state.index;
}
