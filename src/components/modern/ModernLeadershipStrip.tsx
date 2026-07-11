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
  if (!headline && bullets.length === 0) return null;

  return (
    <section className="modern-leadership-strip" aria-labelledby="home-leadership-heading">
      <div className={`${modernLayout.container} ${modernLayout.sectionX}`}>
        <div className="modern-leadership-strip__layout">
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
            {strip.subhead?.trim() ? (
              <p className="modern-leadership-strip__subhead modern-type-body" style={{ color: modern.muted }}>
                {strip.subhead.trim()}
              </p>
            ) : null}
          </div>

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
