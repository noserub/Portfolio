import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { HomePageLogoStrip } from "../../lib/homePageContent";
import { clampLogoImageScale } from "../../lib/logoImageScale";
import { resolveLogoImageUrl } from "../../utils/imageOptimizer";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont } from "../../design/modernTokens";

interface ModernLogoStripProps {
  strip: HomePageLogoStrip;
}

function LogoEntry({
  name,
  imageUrl,
  imageScale = 1,
}: {
  name: string;
  imageUrl?: string | null;
  imageScale?: number;
}) {
  const resolved = useMemo(
    () => (imageUrl ? resolveLogoImageUrl(imageUrl) : null),
    [imageUrl],
  );
  const scale = clampLogoImageScale(imageScale);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved, scale]);

  const slotStyle = {
    "--logo-scale": String(scale),
  } as CSSProperties;

  if (resolved && !failed) {
    return (
      <span className="modern-logo-strip__slot" style={slotStyle} title={name}>
        <img
          src={resolved}
          alt={name}
          className="modern-logo-strip__img"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  if (imageUrl?.trim() && failed) {
    return (
      <span
        className="modern-logo-strip__slot modern-logo-strip__slot--text modern-logo-strip__text--failed"
        style={modernFont}
        title={`Could not load image from ${imageUrl}`}
      >
        <span className="modern-logo-strip__text">{name}</span>
      </span>
    );
  }

  return (
    <span className="modern-logo-strip__slot modern-logo-strip__slot--text" style={modernFont}>
      <span className="modern-logo-strip__text">{name}</span>
    </span>
  );
}

export function ModernLogoStrip({ strip }: ModernLogoStripProps) {
  if (!strip.enabled || strip.entries.length === 0) return null;

  const items = strip.entries.filter((e) => e.name.trim());
  if (items.length === 0) return null;

  const track = [...items, ...items];

  return (
    <section className="modern-logo-strip" aria-label={strip.label?.trim() || "Employers"}>
      <div className={`${modernLayout.container} ${modernLayout.sectionX} modern-logo-strip__inner`}>
        {strip.label?.trim() ? (
          <p className="modern-logo-strip__label" style={{ ...modernFont, color: modern.muted }}>
            {strip.label.trim()}
          </p>
        ) : null}
        <div className="modern-logo-strip__viewport" aria-hidden={items.length <= 3}>
          <div className="modern-logo-strip__track">
            {track.map((entry, index) => (
              <div key={`${entry.name}-${index}`} className="modern-logo-strip__item">
                <LogoEntry
                  name={entry.name}
                  imageUrl={entry.imageUrl}
                  imageScale={entry.imageScale}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
