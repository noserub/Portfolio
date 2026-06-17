import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import type { ProjectData } from "../ProjectImage";
import { projectTypeTag } from "../../lib/modernCaseStudies";
import { projectHeroImageStyle } from "../../lib/projectHeroFrame";
import { modern, modernFont } from "../../design/modernTokens";

interface ModernCaseStudyCardProps {
  project: ProjectData;
  onClick: () => void;
  /** Full-width horizontal card (featured hero or last item when remainder count is odd). */
  layout?: "regular" | "wide";
}

function CaseStudyProtectedBadge() {
  return (
    <span className="modern-case-study-card__protected-badge">
      <Lock size={11} strokeWidth={2} aria-hidden />
      Protected
    </span>
  );
}

function CaseStudyCardImage({
  project,
  title,
  requiresPassword,
  wide,
}: {
  project: ProjectData;
  title: string;
  requiresPassword?: boolean;
  wide?: boolean;
}) {
  const cover = project.url;
  return (
    <div className="modern-case-study-card__image">
      {cover ? (
        <img
          src={cover}
          alt={title}
          className={`w-full h-full transition-opacity duration-700 group-hover:opacity-100 ${wide ? "opacity-85" : "opacity-80"}`}
          style={projectHeroImageStyle(project)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: modern.muted }}>
          No preview
        </div>
      )}
      {requiresPassword ? <CaseStudyProtectedBadge /> : null}
      {wide ? (
        <>
          <div className="modern-case-study-card__scrim modern-case-study-card__scrim--bottom" />
          <div className="modern-case-study-card__scrim modern-case-study-card__scrim--side" />
        </>
      ) : (
        <div className="modern-case-study-card__scrim modern-case-study-card__scrim--bottom" />
      )}
    </div>
  );
}

export function ModernCaseStudyCard({
  project,
  onClick,
  layout = "regular",
}: ModernCaseStudyCardProps) {
  const isWide = layout === "wide";
  const tag = projectTypeTag(project);
  const requiresPassword = Boolean(project.requiresPassword);

  if (isWide) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group modern-case-study-card modern-case-study-card--wide"
      >
        <CaseStudyCardImage project={project} title={project.title} requiresPassword={requiresPassword} wide />

        <div className="flex-1 flex flex-col justify-center p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div
                className="modern-eyebrow mb-2"
                style={modernFont}
              >
                {tag}
              </div>
              <h3
                className="leading-tight mb-1.5 line-clamp-2"
                style={{ ...modernFont, fontWeight: 700, fontSize: "1.125rem", color: modern.text }}
              >
                {project.title}
              </h3>
              {project.description ? (
                <p className="text-sm leading-relaxed line-clamp-2" style={{ ...modernFont, color: modern.muted }}>
                  {project.description}
                </p>
              ) : null}
              <div className="flex items-center gap-1.5 mt-4">
                <span className="text-xs" style={{ ...modernFont, fontWeight: 500, color: modern.accent }}>
                  View case study
                </span>
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                  style={{ color: modern.accent }}
                />
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="shrink-0 mt-0.5 text-[#666666] modern-icon-accent-hover transition-colors"
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="group modern-case-study-card">
      <CaseStudyCardImage project={project} title={project.title} requiresPassword={requiresPassword} />

      <div className="modern-case-study-card__body">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="modern-eyebrow mb-1.5"
              style={modernFont}
            >
              {tag}
            </div>
            <h3
              className="leading-snug line-clamp-2"
              style={{ ...modernFont, fontWeight: 600, fontSize: "1rem", color: modern.text }}
            >
              {project.title}
            </h3>
            {project.description ? (
              <p className="mt-1.5 text-sm leading-relaxed line-clamp-2" style={{ ...modernFont, color: modern.muted }}>
                {project.description}
              </p>
            ) : null}
          </div>
          <ArrowUpRight
            size={14}
            className="shrink-0 mt-1 text-[#666666] modern-icon-accent-hover transition-colors"
          />
        </div>
      </div>
    </button>
  );
}
