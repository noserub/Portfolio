import { ExternalLink } from "lucide-react";
import { cn } from "../ui/utils";

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export function InfoCard({ label, value, icon, href, className }: InfoCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon ? (
            <div className="text-[var(--modern-accent,#84bd00)] shrink-0 mt-0.5">{icon}</div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-1">
              {label}
            </p>
            <p className="text-foreground font-medium break-all">{value}</p>
          </div>
        </div>
        {href ? (
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        ) : null}
      </div>
    </>
  );

  const baseClass = cn(
    "rounded-xl border border-[var(--modern-border)] bg-[var(--modern-surface)] p-6 transition-colors hover:border-[var(--modern-border-hover)]",
    className,
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {content}
      </a>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
