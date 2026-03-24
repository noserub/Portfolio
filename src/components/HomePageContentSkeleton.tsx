import { Skeleton } from "./ui/skeleton";

export function HomeHeroSkeleton() {
  return (
    <div className="text-center space-y-6 mb-16 relative z-10 mt-10 md:mt-20" aria-hidden>
      <div className="flex justify-center px-4">
        <Skeleton className="h-12 sm:h-16 md:h-20 lg:h-24 w-[min(92%,24rem)] mx-auto rounded-xl" />
      </div>
      <div className="flex justify-center items-center mt-6 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-2 rounded-full shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function HomeBioSkeleton() {
  return (
    <div className="max-w-3xl relative z-10 w-full space-y-5" aria-hidden>
      <div className="space-y-3">
        <Skeleton className="h-5 w-full max-w-2xl mx-auto rounded-md" />
        <Skeleton className="h-5 w-full max-w-xl mx-auto rounded-md" />
        <Skeleton className="h-5 w-[85%] max-w-lg mx-auto rounded-md" />
        <Skeleton className="h-5 w-[70%] max-w-md mx-auto rounded-md" />
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-4 justify-center sm:justify-start">
        <Skeleton className="h-11 w-36 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      </div>
    </div>
  );
}

export function HomeStatsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`bg-gradient-to-br from-slate-50/40 via-white/30 to-gray-50/25 dark:from-slate-800/20 dark:via-slate-900/15 dark:to-slate-800/15 backdrop-blur-md rounded-3xl border border-border/20 px-4 py-4 flex flex-row items-center justify-center gap-4 text-left w-full ${
            i === 3 ? "sm:col-span-2" : ""
          }`}
        >
          <Skeleton className="h-11 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 flex flex-col justify-center min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

export function HomeCaseStudiesHeaderSkeleton() {
  return (
    <>
      <div className="mb-6 px-4 text-center md:px-0 flex justify-center">
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>
      <div className="flex flex-wrap justify-center gap-3 mb-6 px-4 md:px-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    </>
  );
}
