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

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    lastY.current = getScrollY();

    const onScroll = () => {
      const y = getScrollY();
      if (y <= TOP_SHOW_PX) {
        setOffscreen(false);
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      lastY.current = y;
      if (delta > SCROLL_DELTA_PX) setOffscreen(true);
      else if (delta < -SCROLL_DELTA_PX) setOffscreen(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true } as AddEventListenerOptions);
    };
  }, [reduceMotion]);

  return { chromeOffscreen: !reduceMotion && offscreen };
}
