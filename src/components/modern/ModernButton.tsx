import { Button } from "../ui/button";
import { cn } from "../ui/utils";

type ModernButtonAppearance = "primary" | "outline" | "ghost";

interface ModernButtonProps extends Omit<React.ComponentProps<typeof Button>, "variant"> {
  appearance?: ModernButtonAppearance;
}

export function ModernButton({
  appearance = "primary",
  className,
  children,
  ...props
}: ModernButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        "rounded-lg font-medium",
        appearance === "primary" && "modern-btn-primary border-0",
        appearance === "outline" &&
          "modern-btn-outline bg-transparent border border-[var(--modern-border-hover)] text-foreground hover:bg-[var(--modern-surface-inset)]",
        appearance === "ghost" && "bg-transparent text-foreground hover:bg-[var(--modern-surface-inset)]",
        className,
      )}
      style={appearance === "primary" ? { color: "var(--modern-accent-on-fill, #0a0a0a)" } : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}
