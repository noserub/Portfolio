import { Skeleton } from "./ui/skeleton";

/** Centered headline placeholder (home hero, suffix-only or single line). */
export function HeroHeadlineSkeleton({ twoLine = false }: { twoLine?: boolean }) {
  if (twoLine) {
    return (
      <div className="flex flex-col items-center gap-3 w-full px-4" aria-hidden>
        <Skeleton className="h-10 sm:h-12 md:h-14 w-[min(100%,14rem)] rounded-lg" />
        <Skeleton className="h-12 sm:h-14 md:h-16 lg:h-[4.5rem] w-[min(100%,18rem)] rounded-lg" />
      </div>
    );
  }
  return (
    <div className="flex justify-center w-full px-4" aria-hidden>
      <Skeleton className="h-12 sm:h-14 md:h-16 lg:h-[4.5rem] w-[min(100%,20rem)] rounded-lg" />
    </div>
  );
}

/** Bio card body: paragraphs + optional CTA row (home / about main cards). */
export function BioCardContentSkeleton({ showCta = true }: { showCta?: boolean }) {
  return (
    <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl space-y-4" aria-hidden>
      <Skeleton className="h-5 w-full max-w-2xl rounded-md" />
      <Skeleton className="h-5 w-full max-w-3xl rounded-md" />
      <Skeleton className="h-5 w-[92%] max-w-2xl rounded-md" />
      <Skeleton className="h-5 w-full max-w-xl rounded-md" />
      <Skeleton className="h-5 w-[85%] max-w-lg rounded-md" />
      {showCta ? (
        <div className="flex items-center gap-4 pt-4">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      ) : null}
    </div>
  );
}

/** Quick stats grid on home. */
export function HomeStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-gradient-to-br from-slate-50/80 via-white/60 to-gray-50/40 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-3xl border border-border/20 shadow-lg px-4 py-4 flex flex-row items-center gap-4 w-full"
          aria-hidden
        >
          <Skeleton className="h-11 w-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-5 w-3/4 max-w-[12rem] rounded-md" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}
