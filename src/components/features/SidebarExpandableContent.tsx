import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../ui/utils";

/** Preview height = 2/3 of 13rem — must match measurement threshold */
const COLLAPSED_REM = (13 * 2) / 3;

function getCollapsedMaxPx(): number {
  if (typeof document === "undefined") return 139;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return COLLAPSED_REM * rem;
}

interface SidebarExpandableContentProps {
  children: React.ReactNode;
  /** Bumps measurement when markdown changes */
  contentVersion: string;
}

/**
 * Collapsed preview + show more/less for long markdown sidebars.
 * Uses inline max-height so clipping always applies (Tailwind arbitrary calc was unreliable).
 */
export function SidebarExpandableContent({
  children,
  contentVersion,
}: SidebarExpandableContentProps) {
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

  const collapsedPx = typeof document !== "undefined" ? getCollapsedMaxPx() : 139;

  const clipStyle: React.CSSProperties | undefined =
    overflowing && !expanded
      ? {
          maxHeight: `${collapsedPx}px`,
          overflow: "hidden",
        }
      : overflowing && expanded
        ? {
            maxHeight: "min(70vh, 48rem)",
            overflowY: "auto",
            scrollbarWidth: "thin",
          }
        : undefined;

  return (
    <div>
      <div className="relative">
        <div
          ref={measureRef}
          style={clipStyle}
          className={cn(
            "transition-[max-height] duration-300 ease-out",
            overflowing && expanded && "[&::-webkit-scrollbar]:w-2"
          )}
        >
          {children}
        </div>

        {overflowing && !expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 via-white/50 to-transparent dark:from-slate-950/90 dark:via-slate-950/45"
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
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={cn(
            "mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-t border-border/30 py-3 text-sm font-medium",
            "text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.06]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp className="h-4 w-4 opacity-70" strokeWidth={2} />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="h-4 w-4 opacity-70" strokeWidth={2} />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
