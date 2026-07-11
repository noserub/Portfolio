import { stripHtmlForDisplay } from "../../lib/modernCaseStudies";
import { MODERN_ABOUT_PROCESS } from "../../design/modernAboutContent";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont } from "../../design/modernTokens";

export interface AboutProcessStep {
  num: string;
  title: string;
  items: string[];
}

interface ModernAboutProcessSectionProps {
  title: string;
  subheading: string;
  steps: AboutProcessStep[];
  editAction?: React.ReactNode;
}

function resolveSteps(steps: AboutProcessStep[]): AboutProcessStep[] {
  if (steps.length > 0) return steps;
  return MODERN_ABOUT_PROCESS.steps.map((step) => ({
    num: `${step.num} · ${step.phase.toUpperCase()}`,
    title: step.title,
    items: [step.description],
  }));
}

export function ModernAboutProcessSection({
  title,
  subheading,
  steps,
  editAction,
}: ModernAboutProcessSectionProps) {
  const resolvedSteps = resolveSteps(steps);
  const resolvedTitle = title.trim() || MODERN_ABOUT_PROCESS.title;
  const resolvedSubheading = subheading.trim() || MODERN_ABOUT_PROCESS.subheading;

  return (
    <section
      id="process"
      className={`modern-about-process ${modernLayout.sectionX} ${modernLayout.aboutSection}`}
      aria-labelledby="about-process-heading"
    >
      <div className={modernLayout.container}>
        <div className="modern-about-process__layout">
          <div className="modern-about-process__intro">
            {editAction ? <div className="mb-4">{editAction}</div> : null}
            <h2
              id="about-process-heading"
              className="text-xs uppercase tracking-widest mb-4"
              style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
            >
              {resolvedTitle}
            </h2>
            {resolvedSubheading ? (
              <p className="modern-about-process__subhead modern-type-body" style={{ color: modern.muted }}>
                {stripHtmlForDisplay(resolvedSubheading)}
              </p>
            ) : null}
          </div>

          <ol className="modern-about-process__steps">
            {resolvedSteps.map((step) => {
              const description = step.items.map((item) => stripHtmlForDisplay(item)).filter(Boolean).join(" ");
              return (
                <li key={`${step.num}-${step.title}`} className="modern-about-process__step">
                  <p
                    className="modern-about-process__step-num"
                    style={{ ...modernFont, fontWeight: 600 }}
                  >
                    {stripHtmlForDisplay(step.num)}
                  </p>
                  <h3
                    className="modern-about-process__step-title modern-type-body mb-1.5"
                    style={{ ...modernFont, fontWeight: 500, color: modern.text }}
                  >
                    {stripHtmlForDisplay(step.title)}
                  </h3>
                  {description ? (
                    <p className="modern-about-process__step-desc text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                      {description}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
