import { Skeleton } from "./ui/skeleton";
import { cn } from "./ui/utils";

/** Headline strip only — no dot row (keeps loading state minimal and intentional). */
export function HomeHeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mb-16 relative z-10 mt-10 md:mt-20 w-full min-w-0",
        className,
      )}
      aria-hidden
    >
      <div className="w-full min-w-0 px-4 box-border">
        <Skeleton className="block h-12 sm:h-16 md:h-20 lg:h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function HomeBioSkeleton() {
  return (
    <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl space-y-5" aria-hidden>
      <div className="space-y-3 w-full min-w-0">
        <Skeleton className="block h-5 w-full min-h-[1.25rem] rounded-md" />
        <Skeleton className="block h-5 w-full min-h-[1.25rem] rounded-md" />
        <Skeleton className="block h-5 w-full min-h-[1.25rem] rounded-md" />
        <Skeleton className="block h-5 w-full min-h-[1.25rem] rounded-md" />
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-4 w-full justify-center sm:justify-start">
        <Skeleton className="h-11 w-36 max-w-full rounded-full" />
      </div>
    </div>
  );
}
