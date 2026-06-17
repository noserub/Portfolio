import { cn } from "../../components/ui/utils";

interface ModernPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernPageLayout({ children, className }: ModernPageLayoutProps) {
  return (
    <main className={cn("min-h-screen pt-24 pb-16 px-6", className)}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </main>
  );
}
