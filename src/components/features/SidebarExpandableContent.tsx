import React, { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../ui/utils";

/** Collapsed cap: 2/3 of prior 13rem (~1/3 shorter) — must match max-h below */
const COLLAPSED_MAX_REM = (13 * 2) / 3;
const COLLAPSED_MAX_PX = COLLAPSED_MAX_REM * 16;

interface SidebarExpandableContentProps {
  children: React.ReactNode;
  /** Bumps measurement when markdown changes */
  contentVersion: string;
}

/**
 * Collapsed preview + show more/less for long markdown sidebars.
 * Keeps sticky case-study rails short without an outer scroll trap.
 */
export function SidebarExpandableContent({
  children,
  contentVersion,
}: SidebarExpandableContentProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [contentVersion]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      setOverflowing(el.scrollHeight > COLLAPSED_MAX_PX + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentVersion]);

  return (
    <div>
      <div className="relative">
        <div
          ref={measureRef}
          className={cn(
            "transition-[max-height] duration-300 ease-out",
            overflowing && !expanded && "max-h-[calc(13rem*2/3)] overflow-hidden",
            overflowing &&
              expanded &&
              "max-h-[min(70vh,48rem)] overflow-y-auto [scrollbar-width:thin]"
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

