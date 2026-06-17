import type { HomePageStat } from "../../lib/homePageContent";
import { cn } from "../ui/utils";

interface StatRowProps {
  stats: HomePageStat[];
  className?: string;
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 py-8 border-y border-[var(--modern-border)]",
        className,
      )}
    >
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="text-center lg:text-left">
          <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {stat.number}
          </div>
          <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
          {stat.description ? (
            <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {stat.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
