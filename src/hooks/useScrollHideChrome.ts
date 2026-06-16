import { useEffect, useRef, useState } from "react";

const TOP_SHOW_PX = 12;
/** Per-event delta; keep small so trackpads and mobile still register direction. */
const SCROLL_DELTA_PX = 2;

function getScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/**
 * Hides fixed top chrome on scroll down and reveals it on scroll up.
 * Respects prefers-reduced-motion (chrome stays visible).
 */
export function useScrollHideChrome() {
  const [offscreen, setOffscreen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lastY = useRef(0);
  const offscreenRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    lastY.current = getScrollY();

    const update = () => {
      rafRef.current = null;
      const y = getScrollY();
      if (y <= TOP_SHOW_PX) {
        if (offscreenRef.current) {
          offscreenRef.current = false;
          setOffscreen(false);
        }
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      lastY.current = y;
      let next = offscreenRef.current;
      if (delta > SCROLL_DELTA_PX) next = true;
      else if (delta < -SCROLL_DELTA_PX) next = false;
      if (next !== offscreenRef.current) {
        offscreenRef.current = next;
        setOffscreen(next);
      }
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [reduceMotion]);

  /** Keep sticky rails / contextual toolbars aligned with visible chrome (case-study sidebar, PageLayout). */
  useEffect(() => {
    const root = document.documentElement;
    const chromeExpanded = reduceMotion || !offscreen;
    root.style.setProperty(
      "--portfolio-sticky-top",
      chromeExpanded ? "6.5rem" : "calc(env(safe-area-inset-top, 0px) + 0.75rem)"
    );
  }, [offscreen, reduceMotion]);

  return { chromeOffscreen: !reduceMotion && offscreen };
}
