import { useEffect, useState } from "react";
import { ArrowUpRight, Edit2 } from "lucide-react";
import { ModernFooter } from "../../components/modern/ModernFooter";
import { ModernResumeLink } from "../../components/modern/ModernResumeLink";
import { ModernAboutEditorPanel } from "../../components/about/ModernAboutEditorPanel";
import { useAboutPageData, DEFAULT_ABOUT_HEADLINE, DEFAULT_ABOUT_LEAD } from "../../hooks/useAboutPageData";
import { useAboutPageEditor } from "../../hooks/useAboutPageEditor";
import { useSEO } from "../../hooks/useSEO";
import { stripHtmlForDisplay } from "../../lib/modernCaseStudies";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { modernLayout } from "../../design/modernLayout";
import { MODERN_ABOUT_HIGHLIGHTS } from "../../design/modernAboutContent";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface ModernAboutProps {
  onNavigateContact: () => void;
  onBack?: () => void;
  isEditMode?: boolean;
}

function AboutBioSkeleton() {
  return (
    <div className={modernLayout.aboutBioSkeleton} aria-hidden>
      <div className="modern-about-bio-skeleton__block">
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-full" />
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-full" />
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-95" />
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-72" />
      </div>
      <div className="modern-about-bio-skeleton__block">
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-full" />
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-92" />
        <div className="modern-about-bio-skeleton__line modern-about-bio-skeleton__line--w-68" />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs uppercase tracking-widest mb-8"
      style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
    >
      {children}
    </h2>
  );
}

export function ModernAbout({ onNavigateContact, onBack, isEditMode = false }: ModernAboutProps) {
  useSEO("about");
  const [aboutEditorOpen, setAboutEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { loading, data, reload } = useAboutPageData();
  const editor = useAboutPageEditor();

  useEffect(() => {
    if (!isEditMode) setAboutEditorOpen(false);
  }, [isEditMode]);

  useEffect(() => {
    if (aboutEditorOpen) void editor.reload();
  }, [aboutEditorOpen, editor.reload]);

  const closeAboutEditor = () => {
    setAboutEditorOpen(false);
    reload();
  };

  const handleAboutEditorDone = async () => {
    setSaving(true);
    const ok = await editor.save();
    setSaving(false);
    if (ok) closeAboutEditor();
  };

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    superPowers: () =>
      data.superPowers.length > 0 ? (
        <section key="superPowers" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.superPowersTitle}</SectionTitle>
            <div className="space-y-3">
              {data.superPowers.map((power, i) => (
                <div key={i} className={modernLayout.aboutListItem}>
                  <span className="mt-0.5 shrink-0 text-[10px]" style={{ ...modernFont, fontWeight: 600, color: modern.accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.text }}>
                    {stripHtmlForDisplay(power)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    highlights: () => {
      const highlights = data.highlights.length > 0 ? data.highlights : MODERN_ABOUT_HIGHLIGHTS;
      return highlights.length > 0 ? (
        <section key="highlights" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.highlightsTitle}</SectionTitle>
            <div className={modernLayout.aboutCardGrid3}>
              {highlights.map((h) => (
                <div key={h.title} className={modernLayout.aboutInlineCard}>
                  <div
                    className="mb-3 text-[10px] uppercase tracking-widest"
                    style={{ ...modernFont, fontWeight: 500, color: modern.accent }}
                  >
                    {h.title}
                  </div>
                  <div className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                    <MarkdownRenderer content={h.text} variant="compact" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null;
    },
    leadership: () =>
      data.leadershipItems.length > 0 ? (
        <section key="leadership" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.leadershipTitle}</SectionTitle>
            <div className={modernLayout.aboutCardGrid3}>
              {data.leadershipItems.map((item) => (
                <div key={item.title} className={modernLayout.aboutInlineCard}>
                  <h3 className="mb-2" style={{ ...modernFont, fontWeight: 500, fontSize: "0.9375rem", color: modern.text }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                    {stripHtmlForDisplay(item.text)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    expertise: () =>
      data.expertiseItems.length > 0 ? (
        <section key="expertise" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.expertiseTitle}</SectionTitle>
            <div className={`${modernLayout.aboutCardGrid2} lg-cols-3`}>
              {data.expertiseItems.map((ex) => (
                <div key={ex.title} className={modernLayout.aboutInlineCard}>
                  <h3 className="mb-2" style={{ ...modernFont, fontWeight: 500, fontSize: "0.9375rem", color: modern.text }}>
                    {ex.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                    {stripHtmlForDisplay(ex.text)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    howIUseAI: () =>
      data.howIUseAIItems.length > 0 ? (
        <section key="howIUseAI" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.howIUseAITitle}</SectionTitle>
            <div className={modernLayout.aboutCardGrid3}>
              {data.howIUseAIItems.map((m, i) => (
                <div key={m.title} className={modernLayout.aboutInlineCard}>
                  <div className="text-[10px] mb-3" style={{ ...modernFont, fontWeight: 600, color: modern.accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mb-2" style={{ ...modernFont, fontWeight: 500, fontSize: "0.9375rem", color: modern.text }}>
                    {m.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                    {stripHtmlForDisplay(m.text)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    process: () =>
      data.processItems.length > 0 ? (
        <section key="process" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.processTitle}</SectionTitle>
            {data.processSubheading ? (
              <p className="mb-8 text-sm leading-relaxed max-w-2xl" style={{ ...modernFont, color: modern.muted }}>
                {stripHtmlForDisplay(data.processSubheading)}
              </p>
            ) : null}
            <div className="space-y-4">
              {data.processItems.map((step) => (
                <div key={step.title} className={modernLayout.aboutInlineCard}>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[10px]" style={{ ...modernFont, fontWeight: 600, color: modern.accent }}>
                      {step.num}
                    </span>
                    <h3 style={{ ...modernFont, fontWeight: 500, fontSize: "0.9375rem", color: modern.text }}>
                      {step.title}
                    </h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {step.items.map((item) => (
                      <li key={item} className="text-sm leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                        {stripHtmlForDisplay(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    certifications: () =>
      data.certificationsItems.length > 0 ? (
        <section key="certifications" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.certificationsTitle}</SectionTitle>
            <div className={`${modernLayout.aboutCardGrid2} max-w-2xl`}>
              {data.certificationsItems.map((cert) => (
                <div key={cert.title} className={modernLayout.aboutInlineCard}>
                  {cert.badge ? (
                    <div className="text-[10px] uppercase tracking-widest mb-2" style={{ ...modernFont, color: modern.accent }}>
                      {cert.badge}
                    </div>
                  ) : null}
                  <h3 className="mb-1" style={{ ...modernFont, fontWeight: 500, fontSize: "0.9375rem", color: modern.text }}>
                    {cert.title}
                  </h3>
                  {cert.org ? (
                    <p className="text-sm" style={{ ...modernFont, color: modern.muted }}>
                      {cert.org}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    tools: () =>
      data.toolsCategories.length > 0 ? (
        <section key="tools" className={`${modernLayout.sectionX} ${modernLayout.aboutSection}`}>
          <div className={modernLayout.container}>
            <SectionTitle>{data.toolsTitle}</SectionTitle>
            <div className={modernLayout.aboutCardGrid2}>
              {data.toolsCategories.map((cat) => (
                <div key={cat.title}>
                  <p
                    className="text-[10px] uppercase tracking-widest mb-4"
                    style={{ ...modernFont, fontWeight: 500, color: modern.muted }}
                  >
                    {cat.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(cat.tools || []).map((tool) => (
                      <span key={tool} className="modern-about-tool-pill text-xs px-3 py-1.5 rounded-full border">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null,
  };

  const sectionOrder = data.sectionOrder.filter((id) => sectionRenderers[id]);

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <ModernAboutEditorPanel
        open={isEditMode && aboutEditorOpen}
        loading={editor.loading}
        draft={editor.draft}
        onPatch={editor.patch}
        onCancel={closeAboutEditor}
        onDone={() => void handleAboutEditorDone()}
        saving={saving}
      />

      <section className={`relative overflow-hidden ${modernLayout.sectionX} ${modernLayout.heroPt} ${modernLayout.aboutHero}`}>
        <div className="absolute inset-0 pointer-events-none modern-hero-glow modern-hero-glow--about" />
        <div className={`relative ${modernLayout.container}`}>
          {isEditMode ? (
            <div className="mb-6">
              <button
                type="button"
                className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
                style={modernFont}
                onClick={() => setAboutEditorOpen(true)}
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden />
                Edit about content
              </button>
            </div>
          ) : null}
          <p className="text-xs uppercase tracking-widest mb-4" style={{ ...modernFont, fontWeight: 600, color: modern.accent }}>
            About Brian
          </p>
          {loading ? (
            <div className="space-y-4 mb-0" aria-hidden>
              <div className="h-10 w-full max-w-xl rounded-md animate-pulse" style={{ background: modern.surface }} />
              <div className="h-16 w-full max-w-2xl rounded-md animate-pulse" style={{ background: modern.surface }} />
            </div>
          ) : (
            <>
              <h1
                className={modernLayout.aboutHeadline}
                style={{
                  ...modernFont,
                  fontWeight: 600,
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  lineHeight: 1.15,
                  color: modern.text,
                }}
              >
                {data.headline || DEFAULT_ABOUT_HEADLINE}
              </h1>
              <p className={`${modernLayout.aboutLead} leading-relaxed`} style={{ ...modernFont, fontSize: "1rem", color: modern.muted }}>
                {data.heroLead || DEFAULT_ABOUT_LEAD}
              </p>
            </>
          )}
          <div className={modernLayout.aboutActions}>
            <button type="button" onClick={onNavigateContact} className="modern-btn-primary" style={modernPrimaryButtonStyle}>
              Get in touch
            </button>
            {data.resumeUrl ? (
              <ModernResumeLink resumeUrl={data.resumeUrl} className="modern-btn-outline" style={modernFont}>
                View resume
                <ArrowUpRight size={14} />
              </ModernResumeLink>
            ) : null}
          </div>
        </div>
      </section>

      <section className={`${modernLayout.sectionX} ${modernLayout.aboutBioSection}`}>
        <div className={modernLayout.container}>
          <div className={modernLayout.aboutBioCard}>
            <div className={modernLayout.aboutBioGrid}>
              <div className={modernLayout.aboutBioMain}>
                {loading ? (
                  <AboutBioSkeleton />
                ) : (
                  <>
                    {data.bioParagraph1 ? (
                      <p className="leading-relaxed" style={{ ...modernFont, fontSize: "0.9375rem", color: modern.text }}>
                        {stripHtmlForDisplay(data.bioParagraph1)}
                      </p>
                    ) : null}
                    {data.bioParagraph2 ? (
                      <p className="leading-relaxed" style={{ ...modernFont, fontSize: "0.9375rem", color: modern.muted }}>
                        {stripHtmlForDisplay(data.bioParagraph2)}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <div className={modernLayout.aboutInfoStack}>
                {[
                  { label: "Company", value: "Oracle" },
                  { label: "Location", value: "Colorado, USA" },
                ].map((item) => (
                  <div key={item.label} className={modernLayout.aboutInfoItem}>
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                      {item.label}
                    </div>
                    <div className={modernLayout.aboutInfoValue}>
                      <span className="text-sm" style={{ ...modernFont, color: modern.text }}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {sectionOrder.map((id) => sectionRenderers[id]?.())}

      <ModernFooter />
    </main>
  );
}
