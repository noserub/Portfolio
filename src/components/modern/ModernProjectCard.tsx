import { ArrowUpRight } from "lucide-react";
import type { ProjectData } from "../ProjectImage";
import { projectTypeTag } from "../../lib/modernCaseStudies";
import { projectCardImageStyle } from "../../lib/projectHeroFrame";
import { cn } from "../ui/utils";

interface ModernProjectCardProps {
  project: ProjectData;
  featured?: boolean;
  onClick: () => void;
  className?: string;
}

function projectCategoryLabel(project: ProjectData): string {
  const type = project.projectType || (project as { project_type?: string }).project_type;
  if (type === "product-design") return "Product Design";
  if (type === "development") return "Development";
  if (type === "branding") return "Branding";
  return "Case Study";
}

export function ModernProjectCard({
  project,
  featured = false,
  onClick,
  className,
}: ModernProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group text-left w-full rounded-xl border border-[var(--modern-border)] bg-[var(--modern-surface)] overflow-hidden transition-colors hover:border-[var(--modern-border-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--modern-accent,#84bd00)]",
        featured ? "md:grid md:grid-cols-2 md:gap-0" : "flex flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--modern-surface-inset)]",
          featured ? "aspect-[16/10] md:aspect-auto md:min-h-[280px]" : "aspect-[4/3]",
        )}
      >
        {project.url ? (
          <img
            src={project.url}
            alt={project.title}
            className="h-full w-full"
            style={projectCardImageStyle(project)}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <div className={cn("p-6 flex flex-col justify-center", featured && "md:p-8")}>
        <p className="text-xs font-medium tracking-wider text-[var(--modern-accent,#84bd00)] uppercase mb-2">
          {projectTypeTag(project)}
        </p>
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{project.title}</h3>
        {project.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{project.description}</p>
        ) : null}
        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-[var(--modern-accent,#84bd00)] transition-colors">
          View case study
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}
