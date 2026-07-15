import { useEffect, useRef, useState } from "react";

const POINTER_SMOOTHING = 0.08;
const MAX_TILT_X = 7; // deg
const MAX_TILT_Y = 9; // deg
/** How long the mobile tap pose holds before returning to rest. */
const TAP_POSE_MS = 2200;
/** Cameo layout + tap (not phone-narrow hide, not desktop pane). */
const CAMEO_MQ = "(min-width: 400px) and (max-width: 899px)";

const SRC = {
  dark: {
    rest: "/hero/minifig-handsdown.png?v=pose-align-2",
    hover: "/hero/minifig-handsup.png?v=pose-align-2",
  },
  light: {
    rest: "/hero/minifig-handsdown-light.svg?v=light-ink-6",
    hover: "/hero/minifig-handsup-light.svg?v=light-ink-6",
  },
} as const;

function readIsDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

/**
 * Hero brand fig: right-pane with pointer parallax from 900px up;
 * 400–899 top-right cameo with tap; hidden below 400 (narrow phones).
 * Rest = hands down; active = hands up (pose is the only delighter).
 * Dark uses neon PNG line art; light uses crisp SVG ink traces.
 * Respects reduced motion.
 */
export function ModernHeroMinifig() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0, active: 0 });
  const currentRef = useRef({ x: 0, y: 0, active: 0 });
  const frameRef = useRef(0);
  const tapTimerRef = useRef(0);
  const [isDark, setIsDark] = useState(readIsDarkTheme);
  const [isCameo, setIsCameo] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(CAMEO_MQ).matches : false,
  );

  useEffect(() => {
    const syncTheme = () => setIsDark(readIsDarkTheme());
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(CAMEO_MQ);
    const sync = () => setIsCameo(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const themeKey = isDark ? "dark" : "light";
    const preload = new Image();
    preload.src = SRC[themeKey].hover;

    if (isCameo) {
      // Mobile/tablet cameo: tap toggles hands-up, then auto-returns to rest.
      const clearTapTimer = () => {
        if (tapTimerRef.current) {
          window.clearTimeout(tapTimerRef.current);
          tapTimerRef.current = 0;
        }
      };

      const onTap = (event: PointerEvent) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        clearTapTimer();
        root.dataset.active = "true";
        tapTimerRef.current = window.setTimeout(() => {
          root.dataset.active = "false";
          tapTimerRef.current = 0;
        }, TAP_POSE_MS);
      };

      root.addEventListener("pointerup", onTap);
      return () => {
        clearTapTimer();
        root.removeEventListener("pointerup", onTap);
        root.dataset.active = "false";
      };
    }

    const hero = root.closest(".modern-hero-section");
    if (!hero) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer =
      typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

    if (reducedMotion || !finePointer) return;

    const updateTarget = (clientX: number, clientY: number, active: number) => {
      const rect = hero.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
      targetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
        active,
      };
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      updateTarget(event.clientX, event.clientY, 1);
    };

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      updateTarget(event.clientX, event.clientY, 1);
      root.dataset.active = "true";
    };

    const onLeave = () => {
      targetRef.current = { ...targetRef.current, active: 0, x: 0, y: 0 };
      root.dataset.active = "false";
    };

    const paint = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      current.x += (target.x - current.x) * POINTER_SMOOTHING;
      current.y += (target.y - current.y) * POINTER_SMOOTHING;
      current.active += (target.active - current.active) * POINTER_SMOOTHING;

      const a = current.active;
      const rotY = current.x * MAX_TILT_Y * a;
      const rotX = -current.y * MAX_TILT_X * a;
      const lift = 1 + 0.018 * a;

      stage.style.transform = `perspective(900px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) scale(${lift.toFixed(4)})`;

      frameRef.current = requestAnimationFrame(paint);
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerenter", onEnter);
    hero.addEventListener("pointerleave", onLeave);
    frameRef.current = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(frameRef.current);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerenter", onEnter);
      hero.removeEventListener("pointerleave", onLeave);
      stage.style.transform = "";
      delete root.dataset.active;
    };
  }, [isDark, isCameo]);

  const sources = isDark ? SRC.dark : SRC.light;

  return (
    <div
      ref={rootRef}
      className="modern-hero-minifig"
      data-active="false"
      data-layout={isCameo ? "cameo" : "pane"}
      data-theme={isDark ? "dark" : "light"}
      aria-hidden
    >
      <div ref={stageRef} className="modern-hero-minifig__stage">
        <div className="modern-hero-minifig__ground" />
        <img
          className="modern-hero-minifig__art modern-hero-minifig__art--rest"
          src={sources.rest}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
        />
        <img
          className="modern-hero-minifig__art modern-hero-minifig__art--hover"
          src={sources.hover}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
}
