import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../ui/utils";

/** ~14rem base + ~3.25rem (~2 body lines at sidebar line-height) before truncation */
const COLLAPSED_REM = 14 + 3.25;

function getCollapsedMaxPx(): number {
  if (typeof document === "undefined") return 276;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return COLLAPSED_REM * rem;
}

interface SidebarExpandableContentProps {
  children: React.ReactNode;
  /** Bumps measurement when markdown changes */
  contentVersion: string;
  /**
   * When expanding, pass to scrollIntoView. Use `end` for the lower sidebar so the expanded
   * block aligns toward the viewport bottom inside the sticky rail.
   */
  scrollIntoViewBlock?: ScrollLogicalPosition;
}

/**
 * Collapsed preview + show more/less for long markdown sidebars.
 * Uses inline max-height so clipping always applies (Tailwind arbitrary calc was unreliable).
 */
export function SidebarExpandableContent({
  children,
  contentVersion,
  scrollIntoViewBlock = "nearest",
}: SidebarExpandableContentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const measure = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    const collapsedPx = getCollapsedMaxPx();

    // Measure natural content height without our clip (React may have applied maxHeight from last commit)
    const prevMax = el.style.maxHeight;
    const prevOv = el.style.overflow;
    el.style.maxHeight = "none";
    el.style.overflow = "visible";
    const natural = el.scrollHeight;
    el.style.maxHeight = prevMax;
    el.style.overflow = prevOv;

    setOverflowing(natural > collapsedPx + 1);
  }, []);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [contentVersion]);

  useLayoutEffect(() => {
    measure();
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentVersion, measure]);

  // After expanding, scroll the rail (or page) so the opened block is visible — especially the lower sidebar.
  useLayoutEffect(() => {
    if (!expanded || !overflowing || !rootRef.current) return;
    const el = rootRef.current;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({
          block: scrollIntoViewBlock,
          behavior: prefersReduced ? "auto" : "smooth",
          inline: "nearest",
        });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [expanded, overflowing, scrollIntoViewBlock]);

  const collapsedPx = typeof document !== "undefined" ? getCollapsedMaxPx() : 276;

  const clipStyle: React.CSSProperties | undefined =
    overflowing && !expanded
      ? {
          maxHeight: `${collapsedPx}px`,
          overflow: "hidden",
        }
      : overflowing && expanded
        ? {
            /* Full height: desktop rail is max-height + overflow-y auto; avoids nested scroll + hidden content */
            maxHeight: "none",
            overflow: "visible",
          }
        : undefined;

  return (
    <div ref={rootRef}>
      <div className="relative">
        <div
          ref={measureRef}
          style={clipStyle}
          className={cn(
            "transition-[max-height] duration-300 ease-out",
            overflowing && expanded && "transition-none"
          )}
        >
          {children}
        </div>

        {overflowing && !expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/95 via-white/50 to-transparent dark:from-slate-950/90 dark:via-slate-950/45"
            aria-hidden
          />
        )}
      </div>

      {overflowing && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            // Keep focus ring from sticking after mouse click (keyboard focus unchanged)
            e.preventDefault();
          }}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "mt-1 flex w-full items-center justify-center gap-1 py-1 text-xs font-medium",
            "text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.06]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
