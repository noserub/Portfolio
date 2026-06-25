import { ExternalLink } from "lucide-react";
import { cn } from "../ui/utils";
import type { ProjectLink } from "../../lib/projectLinks";
import { normalizeProjectLinks } from "../../lib/projectLinks";

interface CaseStudyProjectLinksProps {
  links: ProjectLink[] | unknown;
  className?: string;
}

export function CaseStudyProjectLinks({ links, className }: CaseStudyProjectLinksProps) {
  const valid = normalizeProjectLinks(links);
  if (valid.length === 0) return null;

  return (
    <nav
      className={cn("case-study-project-links order-3 lg:order-none", className)}
      aria-label="Live project links"
    >
      {valid.map((link, index) => (
        <a
          key={`${link.href}-${index}`}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "case-study-project-link",
            link.variant === "primary"
              ? "case-study-project-link--primary modern-btn-primary"
              : link.variant === "ghost"
                ? "case-study-project-link--ghost"
                : "case-study-project-link--secondary modern-btn-outline",
          )}
        >
          <span>{link.label}</span>
          <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        </a>
      ))}
    </nav>
  );
}
