import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle, Linkedin, Mail, MapPin, FileText } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { ModernCaseStudyCard } from "../../components/modern/ModernCaseStudyCard";
import { ModernFooter } from "../../components/modern/ModernFooter";
import { ModernLeadershipStrip } from "../../components/modern/ModernLeadershipStrip";
import { ModernAboutProcessSection } from "../../components/modern/ModernAboutProcessSection";
import { ModernResumeLink } from "../../components/modern/ModernResumeLink";
import { ModernTypingHero } from "../../components/modern/ModernTypingHero";
import { ModernLogoStrip } from "../../components/modern/ModernLogoStrip";
import { AtAGlanceSidebar } from "../../components/features/AtAGlanceSidebar";
import { ImpactSidebar } from "../../components/features/ImpactSidebar";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { MediaGallerySection } from "../../components/MediaGallerySection";
import { Lightbox } from "../../components/Lightbox";
import { WritingBlockRenderer } from "../../components/writing/WritingBlockRenderer";
import { WritingImage } from "../../components/writing/WritingImage";
import { WritingPostMeta } from "../../components/writing/WritingPostMeta";
import type { CaseStudyGallerySection } from "../../types/caseStudySections";
import type { WritingBlock } from "../../types/writingBlocks";
import type { ProjectData } from "../../components/ProjectImage";
import { modernLayout } from "../../design/modernLayout";
import { MODERN_ABOUT_HIGHLIGHTS, MODERN_ABOUT_PROCESS } from "../../design/modernAboutContent";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";
import { FONT_THEME_LIST } from "../../design/fontThemes";
import { writingArticleClass, writingLayout } from "../../design/writingLayout";
import {
  DEFAULT_LOGO_STRIP,
  DEFAULT_STATS,
  defaultHeroTextState,
} from "../../lib/homePageContent";
import { applyPageSEO, getSEOData, loadSEODataFromSupabase } from "../../utils/seoManager";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "principles", label: "Principles" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "interaction", label: "Interaction" },
  { id: "accessibility", label: "Accessibility" },
  { id: "layout", label: "Layout" },
  { id: "home", label: "Home" },
  { id: "surfaces", label: "Surfaces" },
  { id: "about", label: "About" },
  { id: "forms", label: "Forms" },
  { id: "case-study", label: "Case study" },
  { id: "writing", label: "Writing" },
  { id: "motion", label: "Motion" },
  { id: "conventions", label: "Conventions" },
] as const;

const DS_STATIC_HERO = {
  ...defaultHeroTextState(),
  heroHeadlineMode: "static" as const,
  heroHeadlinePrefix: "AI Product",
  heroHeadlineMain: "Design Leader",
};

const DS_PROCESS_STEPS = MODERN_ABOUT_PROCESS.steps.map((step) => ({
  num: `${step.num} · ${step.phase.toUpperCase()}`,
  title: step.title,
  items: [step.description],
}));

const DS_AT_A_GLANCE = `# At a glance

**Role** Lead design

**Scope** Internal knowledge work

**Outcome** Trust, escalation, recovery`;

const DS_IMPACT = `# Impact

- Clearer refusal and escalation paths
- Eval harnesses for behavior, not demos
- Adoption measured after launch`;

type ColorSwatch = {
  name: string;
  cssVar: string;
  tokens: string[];
  role: string;
};

/**
 * Candidate paints. Theme may collapse some at runtime
 * (e.g. inset = canvas in dark; accent = hero ink in dark).
 */
const COLOR_SWATCH_SOURCES: ColorSwatch[] = [
  {
    name: "Canvas",
    cssVar: modern.bg,
    tokens: ["--modern-bg"],
    role: "Page background.",
  },
  {
    name: "Surface",
    cssVar: modern.surface,
    tokens: ["--modern-surface"],
    role: "Cards, panels, elevated chrome.",
  },
  {
    name: "Inset",
    cssVar: modern.surfaceInset,
    tokens: ["--modern-surface-inset"],
    role: "Form wells and recessed areas.",
  },
  {
    name: "Border",
    cssVar: modern.border,
    tokens: ["--modern-border"],
    role: "Quiet edges and dividers at rest.",
  },
  {
    name: "Border strong",
    cssVar: modern.borderHover,
    tokens: ["--modern-border-hover"],
    role: "Hover and stronger interactive edges.",
  },
  {
    name: "Outline edge",
    cssVar: "var(--modern-surface-border)",
    tokens: ["--modern-surface-border"],
    role: "Outline buttons and card borders.",
  },
  {
    name: "Text",
    cssVar: modern.text,
    tokens: ["--modern-text", "--modern-link"],
    role: "Body and headings. Prose links keep text color; underline carries accent.",
  },
  {
    name: "Muted",
    cssVar: modern.muted,
    tokens: ["--modern-muted-text"],
    role: "Meta, captions, secondary UI.",
  },
  {
    name: "Lime",
    cssVar: modern.accent,
    tokens: ["--modern-accent", "--modern-accent-fill", "--ring"],
    role: "Emphasis, CTA fill, focus ring, active nav. Hover fill: --modern-accent-fill-hover.",
  },
  {
    name: "On lime",
    cssVar: modern.accentOnFill,
    tokens: ["--modern-accent-on-fill"],
    role: "Labels on filled CTAs.",
  },
  {
    name: "Hero ink",
    cssVar: modern.heroHeadline,
    tokens: ["--modern-hero-headline"],
    role: "Home H1 lead color.",
  },
];

function resolveBackgroundColor(cssBackground: string): string {
  if (typeof document === "undefined") return cssBackground;
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;left:-9999px;top:0;width:8px;height:8px;background:${cssBackground}`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  document.body.removeChild(probe);
  return value;
}

/** One tile per distinct computed paint in the active theme. */
function mergeSwatchesByPaint(sources: ColorSwatch[]): ColorSwatch[] {
  const groups = new Map<string, { name: string; cssVar: string; tokens: string[]; roles: string[] }>();

  for (const source of sources) {
    const paint = resolveBackgroundColor(source.cssVar);
    const existing = groups.get(paint);
    if (existing) {
      for (const token of source.tokens) {
        if (!existing.tokens.includes(token)) existing.tokens.push(token);
      }
      if (!existing.roles.includes(source.role)) existing.roles.push(source.role);
    } else {
      groups.set(paint, {
        name: source.name,
        cssVar: source.cssVar,
        tokens: [...source.tokens],
        roles: [source.role],
      });
    }
  }

  return Array.from(groups.values()).map((group) => ({
    name: group.name,
    cssVar: group.cssVar,
    tokens: group.tokens,
    role: group.roles.join(" "),
  }));
}
const SAMPLE_CARD_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111408"/>
      <stop offset="55%" stop-color="#1a2208"/>
      <stop offset="100%" stop-color="#84bd00"/>
    </linearGradient>
  </defs>
  <rect width="960" height="720" fill="url(#g)"/>
  <rect x="72" y="96" width="280" height="16" rx="4" fill="#84bd00" opacity="0.85"/>
  <rect x="72" y="140" width="520" height="36" rx="6" fill="#fafafa" opacity="0.92"/>
  <rect x="72" y="196" width="420" height="18" rx="4" fill="#fafafa" opacity="0.45"/>
  <rect x="72" y="480" width="180" height="96" rx="8" fill="#84bd00" opacity="0.35"/>
  <rect x="280" y="520" width="140" height="56" rx="8" fill="#fafafa" opacity="0.12"/>
</svg>`);

const SAMPLE_PROJECT: ProjectData = {
  id: "design-system-specimen",
  url: SAMPLE_CARD_IMAGE,
  title: "Enterprise AI Assistant",
  description: "Trust, escalation, and recovery for internal knowledge work.",
  position: { x: 50, y: 42 },
  scale: 1.05,
  published: true,
  projectType: "product-design",
};

function sampleGallerySvg(seed: string, accentOpacity: string) {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c0e08"/>
      <stop offset="100%" stop-color="#1a2208"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#${seed})"/>
  <rect x="64" y="72" width="240" height="12" rx="3" fill="#84bd00" opacity="${accentOpacity}"/>
  <rect x="64" y="108" width="420" height="28" rx="5" fill="#fafafa" opacity="0.9"/>
  <rect x="64" y="160" width="360" height="14" rx="3" fill="#fafafa" opacity="0.4"/>
  <rect x="64" y="360" width="200" height="120" rx="10" fill="#84bd00" opacity="0.28"/>
  <rect x="300" y="400" width="160" height="80" rx="10" fill="#fafafa" opacity="0.1"/>
</svg>`)
  );
}

const DS_GALLERY_IMAGES = [
  {
    id: "ds-g1",
    url: sampleGallerySvg("a", "0.9"),
    alt: "Flow overview",
    caption: "Refusal and escalation paths",
  },
  {
    id: "ds-g2",
    url: sampleGallerySvg("b", "0.55"),
    alt: "Recovery states",
    caption: "Retry, fallback, escalate",
  },
  {
    id: "ds-g3",
    url: sampleGallerySvg("c", "0.35"),
    alt: "Eval harness",
    caption: "Behavior checks before launch",
  },
];

const DS_IMAGE_GALLERY: CaseStudyGallerySection = {
  id: "ds-gallery-images",
  type: "gallery",
  title: "Key screens",
  position: 0,
  visible: true,
  gallery: {
    mediaMode: "image",
    imageItems: DS_GALLERY_IMAGES,
    videoItems: [],
    columns: 3,
    aspectRatio: "16x9",
  },
};

const DS_MARKDOWN_BODY = `## Problem

Teams shipped demos that looked smart and broke under real workflows.

## Approach

Design the recovery path first. Refusal, escalation, and handoff are product surfaces, not edge cases.

## Outcome

Clearer operator trust and a shared language for evals after launch.`;

const DS_WRITING_HERO = sampleGallerySvg("wh", "0.85");
const DS_WRITING_FIGURE_INLINE = sampleGallerySvg("wi", "0.6");
const DS_WRITING_FIGURE_BLEED = sampleGallerySvg("wb", "0.4");

const DS_WRITING_BLOCKS: WritingBlock[] = [
  {
    id: "ds-w-prose-1",
    type: "prose",
    visible: true,
    content: `## The hard part

Deploy is cheap. Behavior design is not. When teams skip refusal, escalation, and recovery, production writes the next sprint for them.

The interface is the contract with the operator. If the product cannot say "I don't know" cleanly, it will invent answers at the worst moment.`,
  },
  {
    id: "ds-w-figure-inline",
    type: "figure",
    visible: true,
    url: DS_WRITING_FIGURE_INLINE,
    alt: "Decision tree for refusal and escalation",
    caption: "Inline figure · click opens lightbox",
    layout: "inline",
    lightbox: true,
  },
  {
    id: "ds-w-quote",
    type: "pull_quote",
    visible: true,
    text: "If recovery is an afterthought, trust never shows up in the first place.",
    attribution: "Field notes",
  },
  {
    id: "ds-w-prose-2",
    type: "prose",
    visible: true,
    content: `## What to ship

Ship the path under load: empty states, tool failure, handoff, and the language for "not this time." Eval the behavior, not the demo.`,
  },
  {
    id: "ds-w-figure-bleed",
    type: "figure",
    visible: true,
    url: DS_WRITING_FIGURE_BLEED,
    alt: "Wide product capture across a workflow",
    caption: "Full-bleed figure · magazine-scale media",
    layout: "fullBleed",
    lightbox: true,
  },
];

function Swatch({
  name,
  tokens,
  cssVar,
  role,
}: {
  name: string;
  tokens: string[];
  cssVar: string;
  role: string;
}) {
  return (
    <div className="modern-ds-swatch">
      <div className="modern-ds-swatch__chip" style={{ background: cssVar }} aria-hidden />
      <div className="modern-ds-swatch__meta">
        <p className="modern-ds-swatch__name" style={{ ...modernFont, color: modern.text }}>
          {name}
        </p>
        <p className="modern-ds-swatch__role" style={{ ...modernFont, color: modern.muted }}>
          {role}
        </p>
        <div className="modern-ds-swatch__tokens">
          {tokens.map((token) => (
            <code key={token} className="modern-ds-code">
              {token}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="modern-ds-section__header">
      <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
        {eyebrow}
      </p>
      <h2 id={id} className="modern-ds-section__title" style={{ ...modernFont, color: modern.text }}>
        {title}
      </h2>
      {children ? (
        <div className="modern-ds-section__lead" style={{ ...modernFont, color: modern.muted }}>
          {children}
        </div>
      ) : null}
    </header>
  );
}

function DoDont({ doText, dontText }: { doText: string; dontText: string }) {
  return (
    <div className="modern-ds-do-dont">
      <div className="modern-ds-do-dont__item modern-ds-do-dont__item--do">
        <span style={{ ...modernFont, color: modern.accent }}>Do</span>
        <p style={{ ...modernFont, color: modern.text }}>{doText}</p>
      </div>
      <div className="modern-ds-do-dont__item modern-ds-do-dont__item--dont">
        <span style={{ ...modernFont, color: modern.muted }}>Don&apos;t</span>
        <p style={{ ...modernFont, color: modern.text }}>{dontText}</p>
      </div>
    </div>
  );
}

export function ModernDesignSystem() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [colorSwatches, setColorSwatches] = useState<ColorSwatch[]>(COLOR_SWATCH_SOURCES);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const previousTitle = document.title;

    const applyDesignSystemSeo = async () => {
      try {
        const seoData = await loadSEODataFromSupabase();
        if (cancelled) return;
        const siteUrl = seoData.sitewide.siteUrl.replace(/\/$/, "");
        applyPageSEO(
          {
            title: "Design System · Brian Bureson",
            description:
              "Design system for Brian Bureson's custom portfolio: color, type, interaction, and production components from Home, About, Contact, Writing, and case studies.",
            keywords:
              "design system, portfolio design system, modern UI, Brian Bureson, product design",
            ogTitle: "Design System · Brian Bureson",
            ogDescription:
              "Production components and foundations from Brian Bureson's custom portfolio site.",
            ogImage: "",
            twitterCard: "summary_large_image",
            twitterTitle: "Design System · Brian Bureson",
            twitterDescription:
              "Production components and foundations from Brian Bureson's custom portfolio site.",
            twitterImage: "",
            canonicalUrl: `${siteUrl}/design-system`,
          },
          seoData.sitewide,
        );
      } catch {
        if (cancelled) return;
        const local = getSEOData();
        const siteUrl = local.sitewide.siteUrl.replace(/\/$/, "");
        applyPageSEO(
          {
            title: "Design System · Brian Bureson",
            description:
              "Design system for Brian Bureson's custom portfolio: color, type, interaction, and production components from Home, About, Contact, Writing, and case studies.",
            keywords:
              "design system, portfolio design system, modern UI, Brian Bureson, product design",
            ogTitle: "Design System · Brian Bureson",
            ogDescription:
              "Production components and foundations from Brian Bureson's custom portfolio site.",
            ogImage: "",
            twitterCard: "summary_large_image",
            twitterTitle: "Design System · Brian Bureson",
            twitterDescription:
              "Production components and foundations from Brian Bureson's custom portfolio site.",
            twitterImage: "",
            canonicalUrl: `${siteUrl}/design-system`,
          },
          local.sitewide,
        );
      }
    };

    void applyDesignSystemSeo();

    return () => {
      cancelled = true;
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const refreshSwatches = () => setColorSwatches(mergeSwatchesByPaint(COLOR_SWATCH_SOURCES));
    refreshSwatches();

    const root = document.documentElement;
    const observer = new MutationObserver(refreshSwatches);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-design"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", refreshSwatches);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", refreshSwatches);
    };
  }, []);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="modern-ds">
      <div className={`${modernLayout.sectionX} ${modernLayout.heroPt}`}>
        <div className={`${modernLayout.container} modern-ds-shell`}>
          <aside className="modern-ds-toc" aria-label="Design system sections">
            <p className="modern-ds-toc__label" style={{ ...modernFont, color: modern.muted }}>
              On this page
            </p>
            <nav className="modern-ds-toc__nav">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`modern-ds-toc__link${activeSection === section.id ? " modern-ds-toc__link--active" : ""}`}
                  style={modernFont}
                  onClick={() => scrollTo(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="modern-ds-main">
            <section className="modern-ds-section" aria-labelledby="overview">
              <SectionHeader id="overview" eyebrow="Portfolio" title="Design system">
                <p>
                  This is the design system overview for my custom portfolio site. Examples shown are
                  production components.
                </p>
              </SectionHeader>

              <div className="modern-ds-overview-grid">
                <div
                  className="modern-ds-callout"
                  style={{ background: modern.surface, borderColor: modern.border }}
                >
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    What I optimized for
                  </p>
                  <ul className="modern-ds-list" style={{ ...modernFont, color: modern.text }}>
                    <li>Fast scan of work and case studies</li>
                    <li>One interactive language across pages</li>
                    <li>Readable body copy in light and dark</li>
                    <li>CMS edit without a parallel visual language</li>
                  </ul>
                </div>
                <div
                  className="modern-ds-callout"
                  style={{ background: modern.surfaceInset, borderColor: modern.border }}
                >
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    How to use this page
                  </p>
                  <ul className="modern-ds-list" style={{ ...modernFont, color: modern.text }}>
                    <li>Flip light / dark in the nav and re-check color and type</li>
                    <li>Font themes live in the overflow menu when you are signed in</li>
                    <li>Prefer the named tokens below over hard-coded hex</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="principles">
              <SectionHeader id="principles" eyebrow="Intent" title="Principles" />

              <div className="modern-ds-principles">
                {[
                  {
                    title: "One job",
                    body: "Every section earns one purpose. One headline. Short support. Then the thing. If it needs a second job, it needs a second section.",
                  },
                  {
                    title: "Subtract first",
                    body: "If the visitor does not need it, it does not ship. Extra UI on the page is noise.",
                  },
                  {
                    title: "Spend lime carefully",
                    body: "Accent means attention: CTA, active, focus, short emphasis. Used everywhere, it means nothing.",
                  },
                  {
                    title: "Honest interaction",
                    body: "Filled primary advances the task. Outline and ghost handle secondary paths. Active nav uses accent text, not another CTA.",
                  },
                  {
                    title: "Tokens over one-offs",
                    body: "Pull color from --modern-* roles. One-off hex values break light and dark parity.",
                  },
                  {
                    title: "Clarity over decoration",
                    body: "Hierarchy and contrast do the heavy lifting, with decoration supporting the brand message.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="modern-ds-principle"
                    style={{ borderColor: modern.border, background: modern.surface }}
                  >
                    <h3 style={{ ...modernFont, color: modern.text }}>{item.title}</h3>
                    <p style={{ ...modernFont, color: modern.muted }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="color">
              <SectionHeader id="color" eyebrow="Foundations" title="Color" />

              <div className="modern-ds-swatch-grid">
                {colorSwatches.map((item) => (
                  <Swatch
                    key={`${item.name}-${item.tokens.join("-")}`}
                    name={item.name}
                    tokens={item.tokens}
                    cssVar={item.cssVar}
                    role={item.role}
                  />
                ))}
              </div>

              <p style={{ ...modernFont, color: modern.muted, fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                Flip light / dark and the grid collapses to unique paints for that theme. Token
                aliases stack on one tile when values match. Accent washes (
                <code className="modern-ds-code">--modern-accent-subtle</code>, glow) stay
                translucent overlays, not brand fills.
              </p>

              <div className="modern-ds-paper-preview" aria-label="Light mode paper bands">
                <p className="modern-ds-eyebrow modern-ds-paper-preview__eyebrow">
                  Light mode only
                </p>
                <p className="modern-ds-paper-preview__lead">
                  Home section bands. Warm off-whites for light mode. Unused in dark.
                  <code className="modern-ds-code"> --modern-paper-stats</code> matches light canvas,
                  so it is skipped.
                </p>
                <div className="modern-ds-paper-row">
                  {[
                    { label: "Hero", token: "--modern-paper-hero", hex: "#f6f6f3" },
                    { label: "Logos", token: "--modern-paper-logos", hex: "#efefec" },
                    { label: "Leadership", token: "--modern-paper-leadership", hex: "#f3f3f0" },
                  ].map((band) => (
                    <div key={band.token} className="modern-ds-paper-chip">
                      <div
                        className="modern-ds-paper-chip__fill"
                        style={{ background: band.hex }}
                      />
                      <div>
                        <p>{band.label}</p>
                        <code className="modern-ds-code">{band.token}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modern-ds-theme-note">
                <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                  Theme fork · Hero headline
                </p>
                <p style={{ ...modernFont, color: modern.muted, margin: "0.35rem 0 0.85rem" }}>
                  Light and dark disagree on purpose. Light keeps the lead quiet. Dark lets the
                  whole line take lime.
                </p>
                <div className="modern-ds-theme-pair" aria-label="Hero headline in light and dark">
                  <div className="modern-ds-theme-panel modern-ds-theme-panel--light">
                    <p className="modern-ds-theme-panel__label">Light</p>
                    <p className="modern-ds-theme-panel__headline modern-type-display">
                      <span className="modern-ds-theme-panel__ink">Design leadership for </span>
                      <span className="modern-ds-theme-panel__brand">high-stakes systems</span>
                    </p>
                    <p className="modern-ds-theme-panel__meta">
                      Near-black lead · lime brand fragment
                      <br />
                      <code className="modern-ds-code">--modern-hero-headline</code> →{" "}
                      <code className="modern-ds-code">#12140f</code>
                    </p>
                  </div>
                  <div className="modern-ds-theme-panel modern-ds-theme-panel--dark">
                    <p className="modern-ds-theme-panel__label">Dark</p>
                    <p className="modern-ds-theme-panel__headline modern-type-display">
                      <span className="modern-ds-theme-panel__ink">Design leadership for </span>
                      <span className="modern-ds-theme-panel__brand">high-stakes systems</span>
                    </p>
                    <p className="modern-ds-theme-panel__meta">
                      Full line lime
                      <br />
                      <code className="modern-ds-code">--modern-hero-headline</code> → accent
                    </p>
                  </div>
                </div>
              </div>

              <DoDont
                doText="Pick a role (canvas, surface, text, muted, lime), then use its token."
                dontText="Do not invent a second lime or a second near-white for the same job."
              />
            </section>

            <section className="modern-ds-section" aria-labelledby="typography">
              <SectionHeader id="typography" eyebrow="Foundations" title="Typography">
                <p>
                  Body and display come from{" "}
                  <code className="modern-ds-code">--font-body</code> and{" "}
                  <code className="modern-ds-code">--font-display</code>. Default is Inter all the
                  way through. Themes swap families without changing hierarchy.
                </p>
                <p>
                  Two jobs: Home uses display for the hero moment. Case studies, About, and writing
                  stay on the body face so long pages stay readable.
                </p>
              </SectionHeader>

              <div className="modern-ds-type-stack">
                <div className="modern-ds-type-sample">
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    Home · hero headline
                  </p>
                  <h3
                    className="modern-ds-type-hero modern-hero-headline"
                    style={{ fontFamily: modern.displayFont, color: modern.heroHeadline }}
                  >
                    <span className="modern-hero-headline__ink">Design leadership for </span>
                    <span className="modern-hero-headline__brand">high-stakes systems</span>
                  </h3>
                  <p
                    style={{
                      ...modernFont,
                      color: modern.muted,
                      fontSize: "0.8125rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    Display face + theme headline color. Light vs dark compare is under Color.
                  </p>
                </div>
                <div className="modern-ds-type-sample">
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    Home · section title
                  </p>
                  <h3
                    className="modern-ds-type-section"
                    style={{ fontFamily: modern.displayFont, color: modern.text }}
                  >
                    Selected work
                  </h3>
                </div>
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border, marginTop: "0.25rem" }}
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Case study / About · editorial ramp (what long pages use)
                </p>
                <div className="modern-ds-type-editorial">
                  <p
                    className="modern-ds-type-editorial__label"
                    style={{ ...modernFont, color: modern.accent }}
                  >
                    Overview
                  </p>
                  <h3 className="modern-ds-type-editorial__title" style={modernFont}>
                    Enterprise AI Assistant
                  </h3>
                  <p className="modern-ds-type-editorial__lede" style={{ ...modernFont, color: modern.muted }}>
                    Trust, escalation, and recovery for internal knowledge work.
                  </p>
                  <div
                    className="modern-ds-type-editorial__body markdown-content"
                    style={{ ...modernFont, color: modern.text }}
                  >
                    <MarkdownRenderer content="Body stays on the reading face. Links keep body color, with an accent underline on hover." />
                  </div>
                  <p
                    className="modern-ds-type-editorial__meta"
                    style={{ ...modernFont, color: modern.muted }}
                  >
                    Product design · 2024
                  </p>
                </div>
                <p
                  style={{
                    ...modernFont,
                    color: modern.muted,
                    fontSize: "0.8125rem",
                    marginTop: "0.85rem",
                  }}
                >
                  Project title: body face + text color (not hero lime). Section labels: accent
                  uppercase. Same pattern on About section titles and writing prose.
                </p>
              </div>

              <div className="modern-ds-font-themes" style={{ marginTop: "1.75rem" }}>
                <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                  Font themes
                </p>
                <p style={{ ...modernFont, color: modern.muted, margin: "0.35rem 0 0.85rem" }}>
                  Optional. Hierarchy and size stay fixed. Only the faces change. Case studies keep
                  body even when display changes.
                </p>
                <div className="modern-ds-font-theme-grid">
                  {FONT_THEME_LIST.map((theme) => (
                    <div
                      key={theme.id}
                      className="modern-ds-font-theme"
                      style={{ borderColor: modern.border, background: modern.surface }}
                    >
                      <p style={{ ...modernFont, color: modern.text, fontWeight: 600 }}>
                        {theme.label}
                      </p>
                      <p style={{ ...modernFont, color: modern.muted, fontSize: "0.8125rem" }}>
                        {theme.description}
                      </p>
                      <code className="modern-ds-code">{theme.id}</code>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="interaction">
              <SectionHeader id="interaction" eyebrow="Foundations" title="Interaction">
                <p>
                  Three roles cover the published UI: primary CTA, secondary chrome, and active
                  navigation.
                </p>
              </SectionHeader>

              <div className="modern-ds-role-grid">
                <div className="modern-ds-role" style={{ borderColor: modern.border }}>
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    Primary CTA
                  </p>
                  <p style={{ ...modernFont, color: modern.muted, marginBottom: "1rem" }}>
                    The action that moves the task: send, unlock, go to work.
                  </p>
                  <div className="modern-ds-btn-row">
                    <button
                      type="button"
                      className="modern-btn-primary"
                      style={modernPrimaryButtonStyle}
                    >
                      Send message
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="modern-btn-primary"
                      style={{ ...modernPrimaryButtonStyle, opacity: 0.5 }}
                      disabled
                    >
                      Disabled
                    </button>
                  </div>
                  <code className="modern-ds-code modern-ds-code--block">.modern-btn-primary</code>
                </div>

                <div className="modern-ds-role" style={{ borderColor: modern.border }}>
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    Chrome / control
                  </p>
                  <p style={{ ...modernFont, color: modern.muted, marginBottom: "1rem" }}>
                    Secondary paths: cancel, outline links, quiet actions on cards.
                  </p>
                  <div className="modern-ds-btn-row">
                    <button type="button" className="modern-btn-outline" style={modernFont}>
                      View case study
                      <ArrowUpRight className="w-4 h-4" aria-hidden />
                    </button>
                    <button type="button" className="modern-btn-ghost" style={modernFont}>
                      Cancel
                    </button>
                  </div>
                  <code className="modern-ds-code modern-ds-code--block">
                    .modern-btn-outline · .modern-btn-ghost
                  </code>
                </div>

                <div className="modern-ds-role" style={{ borderColor: modern.border }}>
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    Nav active
                  </p>
                  <p style={{ ...modernFont, color: modern.muted, marginBottom: "1rem" }}>
                    Where you are. Accent text or chip. Not a filled button.
                  </p>
                  <div className="modern-ds-btn-row modern-ds-btn-row--nav">
                    <span className="modern-nav-link modern-nav-link--active">Work</span>
                    <span className="modern-nav-link">About</span>
                    <span className="modern-nav-link">Contact</span>
                  </div>
                  <code className="modern-ds-code modern-ds-code--block">
                    .modern-nav-link--active
                  </code>
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Filter chips · Home and Writing share one system
                </p>
                <div className="modern-ds-btn-row">
                  <span className="modern-filter-chip modern-filter-chip--active">All</span>
                  <span className="modern-filter-chip">Product design</span>
                  <span className="modern-filter-chip">Essays</span>
                  <span className="modern-filter-chip">Notes</span>
                </div>
                <code className="modern-ds-code modern-ds-code--block">
                  .modern-filter-chip · .modern-filter-chip--active
                </code>
                <p
                  style={{
                    ...modernFont,
                    color: modern.muted,
                    fontSize: "0.8125rem",
                    marginTop: "0.75rem",
                  }}
                >
                  Writing index uses the same classes via{" "}
                  <code className="modern-ds-code">writingLayout.filterChip</code>.
                </p>
              </div>

              <DoDont
                doText="One primary fill per view. Everything else stays quieter."
                dontText="Do not mark the active tab with primary fill. Active nav uses accent text."
              />
            </section>

            <section className="modern-ds-section" aria-labelledby="accessibility">
              <SectionHeader id="accessibility" eyebrow="Foundations" title="Accessibility">
                <p>
                  Contrast, focus, and reduced motion are required on everything that ships.
                </p>
              </SectionHeader>

              <div className="modern-ds-layout-table" style={{ borderColor: modern.border }}>
                {[
                  {
                    token: "Contrast",
                    use: "Muted text aims AAA on dark surface (~7.3:1). Lime CTAs use near-black labels (--modern-accent-on-fill).",
                  },
                  {
                    token: "Focus",
                    use: "Form fields get a lime border + subtle ring. Interactive chrome uses focus-visible, not persistent outlines on click.",
                  },
                  {
                    token: "Target size",
                    use: "Nav links, overflow trigger, and primary buttons stay thumb-usable. Do not shrink icon-only controls below ~40px.",
                  },
                  {
                    token: "Motion",
                    use: "Page transition and decorative loops collapse under prefers-reduced-motion. Do not bypass with !important.",
                  },
                  {
                    token: "Semantics",
                    use: "One h1 per route. Section titles are h2. Buttons for actions, links for navigation. Labels tied to inputs.",
                  },
                ].map((row) => (
                  <div key={row.token} className="modern-ds-layout-row">
                    <span style={{ ...modernFont, color: modern.text, fontWeight: 600 }}>
                      {row.token}
                    </span>
                    <span style={{ ...modernFont, color: modern.muted }}>{row.use}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="layout">
              <SectionHeader id="layout" eyebrow="Foundations" title="Layout">
                <p>
                  Spacing uses <code className="modern-ds-code">modernLayout</code> classes so
                  gutters stay consistent across pages.
                </p>
              </SectionHeader>

              <div className="modern-ds-layout-table" style={{ borderColor: modern.border }}>
                {[
                  { token: "modern-section-x", use: "Horizontal gutters" },
                  { token: "modern-container", use: "Max-width content column" },
                  { token: "modern-hero-pt / pb", use: "Hero vertical rhythm under sticky nav" },
                  { token: "modern-section-py", use: "Standard section breathing room" },
                  { token: "modern-card-grid", use: "Case study grid" },
                  { token: "--portfolio-sticky-top", use: "Offset for sticky case study rails" },
                ].map((row) => (
                  <div key={row.token} className="modern-ds-layout-row">
                    <code className="modern-ds-code">{row.token}</code>
                    <span style={{ ...modernFont, color: modern.muted }}>{row.use}</span>
                  </div>
                ))}
              </div>

              <div className="modern-ds-spacing-demo" aria-hidden>
                <div className="modern-ds-spacing-demo__bar" style={{ width: "1.5rem" }} />
                <div className="modern-ds-spacing-demo__bar" style={{ width: "2rem" }} />
                <div className="modern-ds-spacing-demo__bar" style={{ width: "2.5rem" }} />
                <span style={{ ...modernFont, color: modern.muted, fontSize: "0.75rem" }}>
                  Section-x gutters: 1.5 → 2 → 2.5rem
                </span>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border, marginTop: "1.5rem" }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Chrome · nav link states (live header sits above this page)
                </p>
                <div className="modern-ds-chrome-demo" style={{ background: modern.surface }}>
                  <div className="modern-ds-chrome-demo__links">
                    <span className="modern-nav-link modern-nav-link--active">Work</span>
                    <span className="modern-nav-link">Writing</span>
                    <span className="modern-nav-link">About</span>
                    <span className="modern-nav-link">Contact</span>
                  </div>
                  <p style={{ ...modernFont, color: modern.muted, fontSize: "0.8125rem" }}>
                    Active is accent. Rest is muted. Hover goes to text.
                  </p>
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="home">
              <SectionHeader id="home" eyebrow="Production" title="Home">
                <p>
                  Hero, CTAs, logo strip, and stats. Case study filters use the shared chip system
                  under Interaction.
                </p>
              </SectionHeader>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Hero · ModernTypingHero (static) + CTAs
                </p>
                <div className="modern-ds-home-hero">
                  <ModernTypingHero hero={DS_STATIC_HERO} />
                  <p
                    className="mt-6 max-w-xl text-sm leading-relaxed"
                    style={{ ...modernFont, color: modern.muted }}
                  >
                    Short bio sits under the headline on Home. Specimens skip the full bio editor
                    document.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="modern-btn-primary"
                      style={modernPrimaryButtonStyle}
                    >
                      Selected work
                      <ArrowRight size={15} aria-hidden />
                    </button>
                    <button type="button" className="modern-btn-ghost" style={modernFont}>
                      Discuss a partnership
                    </button>
                  </div>
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Mid-page · logo strip → divider → stats
                </p>
                <div className="modern-ds-home-stack">
                  <ModernLogoStrip strip={DEFAULT_LOGO_STRIP} />
                  <div className={modernLayout.sectionDivider} aria-hidden="true" />
                  <div className={`${modernLayout.sectionX} ${modernLayout.statsSection}`}>
                    <div className={`${modernLayout.container} ${modernLayout.statsGrid}`}>
                      {DEFAULT_STATS.slice(0, 3).map((stat) => (
                        <div key={stat.label} className="min-w-0">
                          <div
                            className="modern-type-display"
                            style={{
                              fontWeight: 600,
                              fontSize: "clamp(24px, 2.5vw, 32px)",
                              color: modern.accent,
                              lineHeight: 1.1,
                            }}
                          >
                            {stat.number}
                          </div>
                          <div
                            className="mt-1.5 text-sm leading-snug modern-type-body"
                            style={{ fontWeight: 500, color: modern.text }}
                          >
                            {stat.label}
                          </div>
                          {stat.description ? (
                            <div
                              className="mt-1 text-xs leading-relaxed modern-type-body"
                              style={{ color: modern.muted }}
                            >
                              {stat.description}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="surfaces">
              <SectionHeader id="surfaces" eyebrow="Production" title="Surfaces">
                <p>
                  Interactive containers used on Home and Contact. About patterns are covered in
                  the About section.
                </p>
              </SectionHeader>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Case study card
                </p>
                <div className="modern-ds-card-frame">
                  <ModernCaseStudyCard project={SAMPLE_PROJECT} onClick={() => undefined} />
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Leadership strip
                </p>
                <div className="modern-ds-leadership-frame">
                  <ModernLeadershipStrip
                    strip={{
                      enabled: true,
                      label: "Leadership",
                      headline: "I lead design where the cost of being wrong is high.",
                      subhead: "Regulated products, enterprise platforms, and frontier AI.",
                      bullets: [
                        "Align execs, product, and eng on one strategy",
                        "Ship from research through production-ready code",
                        "Measure adoption, not just delivery",
                      ],
                    }}
                  />
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Contact info cards · four-up on production
                </p>
                <div
                  className={`${modernLayout.contactInfoGrid} modern-contact-info-grid--four modern-ds-contact-grid`}
                >
                  {[
                    { icon: Mail, label: "Email", value: "hello@example.com" },
                    { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/…" },
                    { icon: FileText, label: "Resume", value: "View PDF" },
                    { icon: MapPin, label: "Location", value: "Pacific Northwest" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`${modernLayout.contactCard} modern-contact-card--static`}
                    >
                      <item.icon
                        className="w-4 h-4 mb-3"
                        style={{ color: modern.accent }}
                        aria-hidden
                      />
                      <p style={{ ...modernFont, color: modern.muted, fontSize: "0.75rem" }}>
                        {item.label}
                      </p>
                      <p style={{ ...modernFont, color: modern.text, fontWeight: 500 }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="about">
              <SectionHeader id="about" eyebrow="Production" title="About">
                <p>
                  Hero, section titles, numbered lists, inline cards, tool pills, process steps,
                  and the resume outline.
                </p>
              </SectionHeader>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Hero · eyebrow, headline, lead, actions
                </p>
                <div className="modern-ds-about-hero">
                  <p
                    className="text-xs uppercase tracking-widest mb-4"
                    style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
                  >
                    About Brian
                  </p>
                  <h3
                    className={modernLayout.aboutHeadline}
                    style={{
                      ...modernFont,
                      fontWeight: 600,
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      lineHeight: 1.15,
                      color: modern.text,
                      margin: 0,
                    }}
                  >
                    AI-first design leader who still ships.
                  </h3>
                  <p
                    className={`${modernLayout.aboutLead} leading-relaxed`}
                    style={{ ...modernFont, fontSize: "1rem", color: modern.muted }}
                  >
                    I align executives, product, and engineering on strategy, then drive the work
                    from research and design systems through prototypes and production-ready code.
                  </p>
                  <div className={modernLayout.aboutActions}>
                    <button
                      type="button"
                      className="modern-btn-primary"
                      style={modernPrimaryButtonStyle}
                    >
                      Get in touch
                    </button>
                    <ModernResumeLink
                      resumeUrl="https://example.com/resume.pdf"
                      className="modern-btn-outline"
                      style={modernFont}
                      onClick={(e) => e.preventDefault()}
                    >
                      View resume
                    </ModernResumeLink>
                    <button type="button" className="modern-btn-ghost" style={modernFont}>
                      Design system
                    </button>
                  </div>
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Atom · section title
                </p>
                <h3
                  className="text-xs uppercase tracking-widest"
                  style={{ ...modernFont, fontWeight: 600, color: modern.accent, margin: 0 }}
                >
                  What I bring
                </h3>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Molecule · numbered list item (super powers)
                </p>
                <div className="space-y-3 modern-ds-about-list">
                  {[
                    "Translate ambiguous AI goals into a trust model the team can build against.",
                    "Stay close through research, prototypes, and production-ready code.",
                  ].map((line, i) => (
                    <div key={line} className={modernLayout.aboutListItem}>
                      <span
                        className="mt-0.5 shrink-0 text-[10px]"
                        style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ ...modernFont, color: modern.text, margin: 0 }}
                      >
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Molecule · inline cards (highlights / leadership / expertise)
                </p>
                <div className={`${modernLayout.aboutCardGrid3} modern-ds-about-cards`}>
                  {MODERN_ABOUT_HIGHLIGHTS.map((h) => (
                    <div key={h.title} className={modernLayout.aboutInlineCard}>
                      <div
                        className="mb-3 text-[10px] uppercase tracking-widest"
                        style={{ ...modernFont, fontWeight: 500, color: modern.accent }}
                      >
                        {h.title}
                      </div>
                      <div
                        className="text-sm leading-relaxed"
                        style={{ ...modernFont, color: modern.muted }}
                      >
                        <MarkdownRenderer content={h.text} variant="compact" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Atom · tool pills
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Figma", "Cursor", "React", "Eval harnesses"].map((tool) => (
                    <span
                      key={tool}
                      className="modern-about-tool-pill text-xs px-3 py-1.5 rounded-full border"
                      style={modernFont}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Organism · How I work (ModernAboutProcessSection)
                </p>
                <div className="modern-ds-about-process-frame">
                  <ModernAboutProcessSection
                    title={MODERN_ABOUT_PROCESS.title}
                    subheading={MODERN_ABOUT_PROCESS.subheading}
                    steps={DS_PROCESS_STEPS}
                  />
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="forms">
              <SectionHeader id="forms" eyebrow="Production" title="Forms">
                <p>
                  Contact uses Input and Textarea with lime focus rings, muted labels, and a single
                  primary submit.
                </p>
              </SectionHeader>

              <div
                className="modern-ds-form"
                style={{ background: modern.surface, borderColor: modern.border }}
              >
                <div className="modern-ds-form__field">
                  <Label htmlFor="ds-name" style={{ ...modernFont, color: modern.muted }}>
                    Name
                  </Label>
                  <Input id="ds-name" placeholder="Your name" style={modernFont} />
                </div>
                <div className="modern-ds-form__field">
                  <Label htmlFor="ds-email" style={{ ...modernFont, color: modern.muted }}>
                    Email
                  </Label>
                  <Input
                    id="ds-email"
                    type="email"
                    placeholder="you@company.com"
                    style={modernFont}
                  />
                </div>
                <div className="modern-ds-form__field">
                  <Label htmlFor="ds-message" style={{ ...modernFont, color: modern.muted }}>
                    Message
                  </Label>
                  <Textarea
                    id="ds-message"
                    placeholder="What are you working on?"
                    rows={4}
                    style={modernFont}
                  />
                </div>
                <div className="modern-ds-btn-row">
                  <button type="button" className="modern-btn-primary" style={modernPrimaryButtonStyle}>
                    Send message
                  </button>
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Success · .modern-form-success (replaces the form after submit)
                </p>
                <div
                  className="modern-form-success flex items-center gap-3 py-8 px-4 rounded-lg"
                  role="status"
                >
                  <CheckCircle className="w-6 h-6 shrink-0 modern-form-success__icon" aria-hidden />
                  <p style={modernFont}>Thanks! Your message has been sent.</p>
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="case-study">
              <SectionHeader id="case-study" eyebrow="Production" title="Case study anatomy">
                <p>
                  <code className="modern-ds-code">ModernProjectDetail</code> wraps the shared
                  case study body (<code className="modern-ds-code">ClassicProjectDetail</code>
                  ): sticky rails, markdown sections, galleries, lightbox, password gate.
                </p>
              </SectionHeader>

              <div className="modern-ds-anatomy" style={{ borderColor: modern.border }}>
                {[
                  {
                    label: "Hero",
                    detail: "Title, description, cropped media, optional project links",
                  },
                  {
                    label: "Sticky rails",
                    detail: "At a glance and Impact (--portfolio-sticky-top)",
                  },
                  {
                    label: "Sections",
                    detail: "Markdown, galleries, video, flow diagrams",
                  },
                  {
                    label: "Password gate",
                    detail: "Primary submit, outline cancel",
                  },
                  {
                    label: "Lightbox",
                    detail: "Dialog overlay for focused gallery and video",
                  },
                ].map((row, index) => (
                  <div key={row.label} className="modern-ds-anatomy__row">
                    <span
                      className="modern-ds-anatomy__index"
                      style={{ ...modernFont, color: modern.accent }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p style={{ ...modernFont, color: modern.text, fontWeight: 600 }}>
                        {row.label}
                      </p>
                      <p style={{ ...modernFont, color: modern.muted, fontSize: "0.875rem" }}>
                        {row.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border, marginTop: "1.25rem" }}
                data-modern-project-detail
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Hero · title, lead, cropped media
                </p>
                <div className="modern-ds-cs-hero">
                  <h3
                    className="modern-type-body"
                    style={{
                      ...modernFont,
                      color: modern.text,
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    {SAMPLE_PROJECT.title}
                  </h3>
                  <p
                    style={{
                      ...modernFont,
                      color: modern.muted,
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      margin: "0.65rem 0 1.25rem",
                      maxWidth: "36rem",
                    }}
                  >
                    {SAMPLE_PROJECT.description}
                  </p>
                  <div className="case-study-hero">
                    <div className="case-study-hero__media">
                      <img
                        src={SAMPLE_CARD_IMAGE}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border }}
                data-modern-project-detail
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Body · MarkdownRenderer in modern-case-study-overview
                </p>
                <div className="modern-case-study-overview">
                  <h2>Overview</h2>
                  <MarkdownRenderer content={DS_MARKDOWN_BODY} />
                </div>
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border }}
                data-modern-project-detail
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Gallery · MediaGallerySection → FlowDiagramGallery (click opens Lightbox)
                </p>
                <MediaGallerySection
                  section={DS_IMAGE_GALLERY}
                  isEditMode={false}
                  onSectionChange={() => undefined}
                  onImageClick={(image) => {
                    const index = DS_GALLERY_IMAGES.findIndex((item) => item.id === image.id);
                    setLightboxIndex(index >= 0 ? index : 0);
                    setLightboxOpen(true);
                  }}
                />
                <p
                  style={{
                    ...modernFont,
                    color: modern.muted,
                    fontSize: "0.8125rem",
                    marginTop: "1rem",
                  }}
                >
                  Video galleries use the same section shell with{" "}
                  <code className="modern-ds-code">VideoGallery</code> when{" "}
                  <code className="modern-ds-code">mediaMode</code> is video.
                </p>
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border, marginTop: "1.25rem" }}
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Sticky rails · AtAGlanceSidebar + ImpactSidebar
                </p>
                <div className="modern-ds-cs-rails">
                  <AtAGlanceSidebar content={DS_AT_A_GLANCE} />
                  <ImpactSidebar content={DS_IMPACT} />
                </div>
              </div>

              <div className="modern-ds-specimen" style={{ borderColor: modern.border }}>
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Password gate · inline (production opens as overlay)
                </p>
                <div
                  className="case-study-password-dialog modern-ds-password-card"
                  role="group"
                  aria-label="Password dialog specimen"
                >
                  <h3 className="case-study-password-dialog__title text-xl font-bold">
                    Password required
                  </h3>
                  <p
                    className="case-study-password-dialog__subtitle text-sm mt-1"
                    style={{ color: modern.muted }}
                  >
                    Enterprise AI Assistant
                  </p>
                  <div className="mt-6 space-y-3">
                    <Input type="password" placeholder="Password" readOnly style={modernFont} />
                    <button
                      type="button"
                      className="modern-btn-primary case-study-password-dialog__submit"
                      style={modernPrimaryButtonStyle}
                    >
                      Unlock
                    </button>
                    <button
                      type="button"
                      className="modern-btn-outline case-study-password-dialog__cancel"
                      style={modernFont}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className="modern-ds-btn-row" style={{ marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="modern-btn-primary case-study-project-link"
                  style={modernPrimaryButtonStyle}
                >
                  Try live site
                  <ArrowUpRight className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="modern-btn-outline case-study-project-link"
                  style={modernFont}
                >
                  Design system
                </button>
                <button
                  type="button"
                  className="modern-btn-ghost case-study-project-link"
                  style={modernFont}
                >
                  Source notes
                </button>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="writing">
              <SectionHeader id="writing" eyebrow="Production" title="Writing">
                <p>
                  Index cards with thumbs, magazine hero, and body blocks from{" "}
                  <code className="modern-ds-code">WritingBlockRenderer</code> (prose, figures,
                  pull quote). Layouts: essay, magazine, note.
                </p>
              </SectionHeader>

              <div className="modern-ds-writing-grid">
                <article
                  className={writingLayout.card}
                  style={{ background: modern.surface, borderColor: modern.border }}
                >
                  <WritingImage
                    src={DS_WRITING_HERO}
                    alt=""
                    wrapperClassName="modern-writing-card__thumb-wrap"
                    className="modern-writing-card__thumb"
                  />
                  <p
                    style={{
                      ...modernFont,
                      color: modern.accent,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Essay
                  </p>
                  <h3
                    className={writingLayout.cardTitle}
                    style={{ ...modernFont, color: modern.text }}
                  >
                    Behavior design when deploy is cheap
                  </h3>
                  <p
                    className={writingLayout.cardExcerpt}
                    style={{ ...modernFont, color: modern.muted }}
                  >
                    Teams skip the hard part of AI product work. The interface is the contract.
                  </p>
                  <WritingPostMeta
                    author="Brian Bureson"
                    date="Jul 2026"
                    readingMinutes={4}
                    topics={["AI", "Product"]}
                  />
                </article>
                <article
                  className={writingLayout.card}
                  style={{ background: modern.surface, borderColor: modern.border }}
                >
                  <WritingImage
                    src={DS_WRITING_FIGURE_INLINE}
                    alt=""
                    wrapperClassName="modern-writing-card__thumb-wrap"
                    className="modern-writing-card__thumb"
                  />
                  <p
                    style={{
                      ...modernFont,
                      color: modern.accent,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Note
                  </p>
                  <h3
                    className={writingLayout.cardTitle}
                    style={{ ...modernFont, color: modern.text }}
                  >
                    Three interaction roles
                  </h3>
                  <p
                    className={writingLayout.cardExcerpt}
                    style={{ ...modernFont, color: modern.muted }}
                  >
                    CTA fill, nav active, control rest. Keep the chrome honest.
                  </p>
                  <WritingPostMeta
                    author="Brian Bureson"
                    date="Jun 2026"
                    readingMinutes={2}
                    topics={["Systems"]}
                  />
                </article>
              </div>

              <div
                className="modern-ds-specimen"
                style={{ borderColor: modern.border, marginTop: "1.25rem" }}
              >
                <p
                  className="modern-ds-specimen__label"
                  style={{ ...modernFont, color: modern.muted }}
                >
                  Magazine post · hero, meta, prose, figures, pull quote
                </p>
                <div className="modern-ds-writing-article">
                  <div className="modern-writing-hero">
                    <WritingImage
                      src={DS_WRITING_HERO}
                      alt=""
                      wrapperClassName="modern-writing-hero__media"
                      className="modern-writing-hero__img"
                    />
                  </div>
                  <div className={writingLayout.layout}>
                    <article className={writingArticleClass("magazine")}>
                      <header className={writingLayout.articleHeader}>
                        <button
                          type="button"
                          className={writingLayout.back}
                          style={{ ...modernFont, color: modern.muted }}
                        >
                          ← All writing
                        </button>
                        <h3
                          className={writingLayout.articleTitle}
                          style={{ ...modernFont, color: modern.text }}
                        >
                          Behavior design when deploy is cheap
                        </h3>
                        <p
                          className={writingLayout.articleSubtitle}
                          style={{ ...modernFont, color: modern.muted }}
                        >
                          The interface is the contract.
                        </p>
                        <WritingPostMeta
                          author="Brian Bureson"
                          date="Jul 14, 2026"
                          readingMinutes={4}
                          topics={["AI", "Behavior design"]}
                        />
                      </header>
                      <WritingBlockRenderer blocks={DS_WRITING_BLOCKS} />
                      <footer className={writingLayout.footerNav}>
                        <span style={{ ...modernFont, fontSize: "0.875rem", color: modern.muted }}>
                          ← All writing
                        </span>
                      </footer>
                    </article>
                  </div>
                </div>
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="motion">
              <SectionHeader id="motion" eyebrow="Foundations" title="Motion">
                <p>
                  Motion for hierarchy and presence. Decorative loops shut off when the OS asks
                  for less.
                </p>
              </SectionHeader>

              <div className="modern-ds-layout-table" style={{ borderColor: modern.border }}>
                {[
                  { token: "PageContentTransition", use: "Route crossfade" },
                  { token: "Typing hero cursor", use: "Home headline emphasis" },
                  { token: "Logo marquee", use: "Home logo strip" },
                  { token: "Minifig drift / cameo", use: "Pane ≥900; cameo 400–899; hidden <400" },
                  { token: "Button / link", use: "150ms color and border feedback" },
                ].map((row) => (
                  <div key={row.token} className="modern-ds-layout-row">
                    <code className="modern-ds-code">{row.token}</code>
                    <span style={{ ...modernFont, color: modern.muted }}>{row.use}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="modern-ds-section" aria-labelledby="conventions">
              <SectionHeader id="conventions" eyebrow="Build" title="Implementation conventions">
                <p>Rules for changing this UI without drifting from the system.</p>
              </SectionHeader>

              <div className="modern-ds-layout-table" style={{ borderColor: modern.border }}>
                {[
                  {
                    token: "Tokens",
                    use: "Use modern / modernFont / modernPrimaryButtonStyle from modernTokens.ts. Add CSS vars in modern.css first.",
                  },
                  {
                    token: "Layout",
                    use: "Pull class names from modernLayout.ts. Styles live in modern.css so utilities are not dropped.",
                  },
                  {
                    token: "Buttons",
                    use: "Prefer .modern-btn-* classes. Avoid inventing a fourth visual weight.",
                  },
                  {
                    token: "Kit UI",
                    use: "Input, Textarea, Label, DropdownMenu, Dialog, AlertDialog, Select, Switch, Checkbox, Sonner as used. Leave the rest alone.",
                  },
                  {
                    token: "Owner data",
                    use: "Published content reads the portfolio owner row (getPortfolioOwnerUserId). Do not fork public vs edit queries.",
                  },
                  {
                    token: "Scope gate",
                    use: "If you cannot point to a live page that uses a component, do not document it here or ship it in visitor UI.",
                  },
                ].map((row) => (
                  <div key={row.token} className="modern-ds-layout-row">
                    <span style={{ ...modernFont, color: modern.text, fontWeight: 600 }}>
                      {row.token}
                    </span>
                    <span style={{ ...modernFont, color: modern.muted }}>{row.use}</span>
                  </div>
                ))}
              </div>

              <div className="modern-ds-scope-grid" style={{ marginTop: "1.25rem" }}>
                <div
                  className="modern-ds-callout"
                  style={{ background: modern.surface, borderColor: modern.border }}
                >
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.accent }}>
                    In this doc
                  </p>
                  <ul className="modern-ds-list" style={{ ...modernFont, color: modern.text }}>
                    <li>--modern-* paints (deduped) + theme forks</li>
                    <li>.modern-btn-* · .modern-filter-chip (Home and Writing)</li>
                    <li>Home hero, logo strip, stats</li>
                    <li>Case study card, hero, body, gallery, lightbox, rails, password</li>
                    <li>About hero, list, cards, tool pills, process, resume + DS ghost</li>
                    <li>Writing index thumbs + magazine post with figures</li>
                    <li>Contact four-up + form + success state</li>
                  </ul>
                </div>
                <div
                  className="modern-ds-callout"
                  style={{ background: modern.surfaceInset, borderColor: modern.border }}
                >
                  <p className="modern-ds-eyebrow" style={{ ...modernFont, color: modern.muted }}>
                    Out of scope
                  </p>
                  <ul className="modern-ds-list" style={{ ...modernFont, color: modern.text }}>
                    <li>Unused shadcn (calendar, chart, sidebar, carousel, …)</li>
                    <li>Unused ModernHero experiments</li>
                    <li>Edit-mode Component Library dump</li>
                    <li>Classic pill-nav chrome</li>
                    <li>Theme folder reference export</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ModernFooter />

      {lightboxOpen ? (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={DS_GALLERY_IMAGES[lightboxIndex]?.url ?? DS_GALLERY_IMAGES[0].url}
          imageAlt={DS_GALLERY_IMAGES[lightboxIndex]?.alt ?? DS_GALLERY_IMAGES[0].alt}
          imageCaption={DS_GALLERY_IMAGES[lightboxIndex]?.caption}
          images={DS_GALLERY_IMAGES.map(({ url, alt, caption }) => ({ url, alt, caption }))}
          currentIndex={lightboxIndex}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}

export default ModernDesignSystem;
