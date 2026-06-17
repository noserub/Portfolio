import { ThemeAwareLogo } from "../ThemeAwareLogo";
import { resolvePortfolioLogoUrl } from "../../lib/portfolioLogo";

interface ModernBrandLogoProps {
  logoUrl?: string | null;
  variant?: "header" | "footer";
  className?: string;
}

export function ModernBrandLogo({
  logoUrl,
  variant = "header",
  className = "",
}: ModernBrandLogoProps) {
  return (
    <ThemeAwareLogo
      logoUrl={resolvePortfolioLogoUrl(logoUrl)}
      alt="Brian Bureson"
      className={`modern-brand-logo modern-brand-logo--${variant}${className ? ` ${className}` : ""}`}
    />
  );
}
