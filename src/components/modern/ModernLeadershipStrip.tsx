import type { HomePageLeadershipStrip } from "../../lib/homePageContent";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont } from "../../design/modernTokens";

interface ModernLeadershipStripProps {
  strip: HomePageLeadershipStrip;
}

export function ModernLeadershipStrip({ strip }: ModernLeadershipStripProps) {
  if (!strip.enabled) return null;

  const headline = strip.headline?.trim();
  const bullets = strip.bullets.map((b) => b.trim()).filter(Boolean);
  const label = strip.label?.trim();
  const subhead = strip.subhead?.trim();
  if (!headline && !label && !subhead && bullets.length === 0) return null;

  const hasIntroCopy = Boolean(headline || subhead);
  const layoutClass = [
    "modern-leadership-strip__layout",
    !hasIntroCopy && !label ? "modern-leadership-strip__layout--list-only" : "",
    !hasIntroCopy && label ? "modern-leadership-strip__layout--label-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="modern-leadership-strip" aria-label={label || headline || "Led"}>
      <div className={`${modernLayout.container} ${modernLayout.sectionX}`}>
        <div className={layoutClass}>
          {label || hasIntroCopy ? (
            <div className="modern-leadership-strip__intro">
              {label ? (
                <p
                  className="modern-leadership-strip__label text-xs uppercase tracking-widest mb-4"
                  style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
                >
                  {label}
                </p>
              ) : null}
              {headline ? (
                <h2
                  id="home-leadership-heading"
                  className="modern-leadership-strip__headline modern-type-display"
                  style={{ color: modern.text }}
                >
                  {headline}
                </h2>
              ) : null}
              {subhead ? (
                <p className="modern-leadership-strip__subhead modern-type-body" style={{ color: modern.muted }}>
                  {subhead}
                </p>
              ) : null}
            </div>
          ) : null}

          {bullets.length > 0 ? (
            <ul className="modern-leadership-strip__list">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="modern-leadership-strip__item modern-type-body"
                  style={{ color: modern.text }}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
