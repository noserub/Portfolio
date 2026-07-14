import { Suspense, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RouteContentFallback } from "./RouteContentFallback";

interface PageContentTransitionProps {
  /** Stable identity for the active view (page + detail id when needed). */
  pageKey: string;
  /** Skip animation in edit mode or immersive flows. */
  disabled?: boolean;
  children: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Content crossfade on route change. Chrome/nav stay outside this tree.
 *
 * Suspense lives *inside* the keyed frame so lazy-route chunk loads do not
 * tear down AnimatePresence (that was killing exit/enter entirely).
 *
 * Enter uses a short rise; after settle we drop transform so sticky rails work.
 */
export function PageContentTransition({
  pageKey,
  disabled = false,
  children,
}: PageContentTransitionProps) {
  const reduceMotion = useReducedMotion();
  const skip = disabled || Boolean(reduceMotion);
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        ref={frameRef}
        initial={skip ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={skip ? undefined : { opacity: 0, y: -10 }}
        transition={
          skip
            ? { duration: 0 }
            : {
                opacity: { duration: 0.28, ease: EASE },
                y: { duration: 0.32, ease: EASE },
              }
        }
        onAnimationComplete={(definition) => {
          if (skip || definition === "exit") return;
          const el = frameRef.current;
          if (el) {
            el.style.transform = "none";
            el.style.willChange = "auto";
          }
        }}
        data-motion="page-content"
        style={skip ? undefined : { willChange: "opacity, transform" }}
      >
        <Suspense fallback={<RouteContentFallback />}>{children}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
