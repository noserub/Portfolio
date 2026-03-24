interface ProjectCardSkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 6 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 shadow-lg backdrop-blur-md dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20"
        >
          <div className="motion-reduce:animate-none relative p-6 animate-pulse">
            <div className="mb-4 h-48 w-full rounded-xl bg-muted/80" />
            <div className="mb-3 h-6 w-4/5 rounded-lg bg-muted/80" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted/70" />
              <div className="h-4 w-3/4 rounded bg-muted/70" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
