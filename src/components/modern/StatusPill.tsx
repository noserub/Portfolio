import { cn } from "../ui/utils";

interface StatusPillProps {
  location?: string;
  status?: string;
  className?: string;
}

export function StatusPill({
  location = "Colorado, USA",
  status = "Open to new opportunities",
  className,
}: StatusPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--modern-border)] bg-[var(--modern-surface)] px-4 py-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
      <span>
        {status}
        {location ? ` — ${location}` : ""}
      </span>
    </div>
  );
}
