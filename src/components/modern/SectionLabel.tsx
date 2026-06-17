import { cn } from "../ui/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.2em] text-[var(--modern-accent,#84bd00)] uppercase mb-3",
        className,
      )}
    >
      {children}
    </p>
  );
}
