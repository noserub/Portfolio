import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ProjectData } from "../../components/ProjectImage";
import { BioDocumentRenderer } from "../../components/HomeBioDocument";
import { ModernTypingHero } from "../../components/modern/ModernTypingHero";
import { ModernHeroAtmosphere } from "../../components/modern/ModernHeroAtmosphere";
import { ModernCaseStudyCard } from "../../components/modern/ModernCaseStudyCard";
import { ModernFooter } from "../../components/modern/ModernFooter";
import { usePublicHomePageContent } from "../../hooks/usePublicHomePageContent";
import { useSEO } from "../../hooks/useSEO";
import { useProjects } from "../../contexts/ProjectsContext";
import { useModernCaseStudies, layoutCaseStudiesForGrid } from "../../lib/modernCaseStudies";
import { defaultBioDocument, healDegenerateHeroBio } from "../../lib/homePageContent";
import { getProjectCardFrame } from "../../lib/projectHeroFrame";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface ModernHomeProps {
  onStartClick: () => void;
  onProjectClick: (project: ProjectData, updateCallback: (project: ProjectData) => void) => void;
  onNavigateContact: () => void;
  isEditMode?: boolean;
  onProjectUpdate?: (project: ProjectData) => void;
}

type CropDraft = { scale: number; position: { x: number; y: number } };

export function ModernHome({
  onStartClick,
  onProjectClick,
  onNavigateContact,
  isEditMode = false,
  onProjectUpdate,
}: ModernHomeProps) {
  useSEO("home");
  const { fullName } = usePortfolioProfileNav();
  const { homePageContent, loading: homeContentLoading } = usePublicHomePageContent();
  const { projects, loading: projectsLoading } = useProjects();
  const caseStudies = useModernCaseStudies(projects, projectsLoading);

  const [filter, setFilter] = useState<string>("all");
  const userOverrideRef = useRef(false);
  const [croppingProjectId, setCroppingProjectId] = useState<string | null>(null);
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const cropProjectRef = useRef<ProjectData | null>(null);

  const visibleFilters = useMemo(() => {
    const types = new Set<string>();
    caseStudies.forEach((p) => {
      const t = p.projectType || (p as { project_type?: string }).project_type;
      if (t) types.add(t);
    });
    return homePageContent.ui.caseStudyFilters.filter((f) => types.has(f.id));
  }, [caseStudies, homePageContent.ui.caseStudyFilters]);

  useEffect(() => {
    if (homeContentLoading || userOverrideRef.current) return;
    const df = homePageContent.ui.defaultCaseStudyFilter ?? "all";
    setFilter(df === "all" ? "all" : df);
  }, [homeContentLoading, homePageContent.ui.defaultCaseStudyFilter]);

  const filtered = useMemo(() => {
    if (filter === "all") return caseStudies;
    return caseStudies.filter((p) => {
      const t = p.projectType || (p as { project_type?: string }).project_type;
      return t === filter;
    });
  }, [caseStudies, filter]);

  const { featured, rest } = useMemo(
    () => layoutCaseStudiesForGrid(filtered, homePageContent.ui.featuredCaseStudyId),
    [filtered, homePageContent.ui.featuredCaseStudyId],
  );

  const heroText = homePageContent.hero;
  const bioDocument = healDegenerateHeroBio(heroText).bioDocument ?? defaultBioDocument();

  const handleProject = (project: ProjectData) => {
    if (isEditMode) return;
    onProjectClick(project, () => {});
  };

  const handleEditCaseStudy = (project: ProjectData) => {
    onProjectClick(project, () => {});
  };

  const startCrop = useCallback((project: ProjectData) => {
    cropProjectRef.current = project;
    setCroppingProjectId(project.id);
    setCropDraft(getProjectCardFrame(project));
  }, []);

  const cancelCrop = useCallback(() => {
    setCroppingProjectId(null);
    setCropDraft(null);
    cropProjectRef.current = null;
  }, []);

  const saveCrop = useCallback(() => {
    const base = cropProjectRef.current;
    if (!base || !cropDraft || !onProjectUpdate) {
      cancelCrop();
      return;
    }
    onProjectUpdate({
      ...base,
      scale: cropDraft.scale,
      position: cropDraft.position,
    });
    cancelCrop();
  }, [cropDraft, cancelCrop, onProjectUpdate]);

  const renderCard = (project: ProjectData, layout: "regular" | "wide") => {
    const isCropping = croppingProjectId === project.id;
    return (
      <ModernCaseStudyCard
        key={project.id}
        project={project}
        layout={layout}
        onClick={() => handleProject(project)}
        isEditMode={isEditMode}
        isCropping={isCropping}
        cropDraft={isCropping ? cropDraft ?? undefined : undefined}
        onStartCrop={() => startCrop(project)}
        onCropDraftChange={isCropping ? setCropDraft : undefined}
        onCropDone={saveCrop}
        onCropCancel={cancelCrop}
        onEditCaseStudy={() => handleEditCaseStudy(project)}
      />
    );
  };

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      {/* Hero */}
      <section
        className={`relative overflow-hidden ${modernLayout.sectionX} ${modernLayout.heroPt} ${modernLayout.heroPb}`}
      >
        <ModernHeroAtmosphere />
        <div className={`relative z-[1] ${modernLayout.container}`}>
          <div className="max-w-3xl min-w-0">
            <div
              className="inline-flex items-center gap-2 mb-8 sm:mb-10 px-3 py-1.5 rounded-full border"
              style={{ borderColor: modern.border, background: modern.surface }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: modern.accent }} />
              <span className="text-xs leading-none" style={{ ...modernFont, color: modern.muted }}>
                {fullName} · Colorado, USA
              </span>
            </div>

            <ModernTypingHero hero={heroText} loading={homeContentLoading} />

            <div className="mt-6 sm:mt-8 max-w-xl">
              <BioDocumentRenderer
                document={bioDocument}
                variant="modern"
                paragraphGapRem={0.75}
                lineHeight={1.65}
              />
            </div>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartClick}
                className="modern-btn-primary"
                style={modernPrimaryButtonStyle}
              >
                About Brian
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={onNavigateContact}
                className="modern-btn-outline"
                style={modernFont}
              >
                Get in touch
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={modernLayout.hr} aria-hidden />

      {/* Stats */}
      <section className={`${modernLayout.sectionX} ${modernLayout.statsSection}`}>
        <div className={`${modernLayout.container} ${modernLayout.statsGrid}`}>
          {homePageContent.stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <div
                style={{
                  ...modernFont,
                  fontWeight: 600,
                  fontSize: "clamp(24px, 2.5vw, 32px)",
                  color: modern.accent,
                  lineHeight: 1.1,
                }}
              >
                {stat.number}
              </div>
              <div
                className="mt-1.5 text-sm leading-snug"
                style={{ ...modernFont, fontWeight: 500, color: modern.text }}
              >
                {stat.label}
              </div>
              {stat.description ? (
                <div className="mt-1 text-xs leading-relaxed" style={{ ...modernFont, color: modern.muted }}>
                  {stat.description}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Case studies */}
      <section id="case-studies" className="scroll-mt-20">
        <div className={modernLayout.dividerBand}>
          <div className={modernLayout.sectionX}>
            <div className={`${modernLayout.container} flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6`}>
            <h2 style={{ ...modernFont, fontWeight: 600, fontSize: "1.125rem", color: modern.text }}>
              {homePageContent.ui.caseStudiesTitle || "Case studies"}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  userOverrideRef.current = true;
                  setFilter("all");
                }}
                className={`modern-filter-chip${filter === "all" ? " modern-filter-chip--active" : ""}`}
                style={modernFont}
              >
                All
              </button>
              {visibleFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    userOverrideRef.current = true;
                    setFilter(f.id);
                  }}
                  className={`modern-filter-chip${filter === f.id ? " modern-filter-chip--active" : ""}`}
                  style={modernFont}
                >
                  {f.label}
                </button>
              ))}
            </div>
            </div>
          </div>
        </div>

        <div className={`${modernLayout.sectionX} ${modernLayout.belowDividerPt} modern-case-studies-grid`}>
          <div className={modernLayout.container}>
          {isEditMode ? (
            <p className="modern-home-edit-hint" style={modernFont}>
              Editing on the published layout. Use <strong>Adjust cover</strong> to crop each card image, or{" "}
              <strong>Edit case study</strong> for full content.
            </p>
          ) : null}
          {projectsLoading ? (
            <p className="text-sm" style={{ color: modern.muted }}>
              Loading case studies…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm" style={{ color: modern.muted }}>
              No published case studies match this filter.
            </p>
          ) : (
            <div className={modernLayout.cardGrid}>
              {featured ? renderCard(featured, "wide") : null}
              {rest.map((project, i) => {
                const isLast = i === rest.length - 1;
                const isWide = isLast && rest.length % 2 === 1;
                return renderCard(project, isWide ? "wide" : "regular");
              })}
            </div>
          )}
          </div>
        </div>
      </section>

      <ModernFooter />
    </main>
  );
}
