import { useEffect, useRef, useState } from "react";

// Server-side renders (the knowledge export) have no window: treat them like reduced motion
// so the real numbers are rendered instead of 0.
const prefersReducedMotion = () =>
  typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from 0 to `target` the first time the returned ref scrolls into view. */
export function useCountUp<T extends Element>(target: number, durationMs = 1400) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          // A frame's timestamp can be a little earlier than `start`: clamp, or the first frame shows "-2%".
          const progress = Math.min(Math.max((now - start) / durationMs, 0), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, durationMs]);

  return { ref, value };
}
