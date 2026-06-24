import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProjectData } from "../../components/ProjectImage";
import { BioDocumentRenderer } from "../../components/HomeBioDocument";
import { ModernTypingHero } from "../../components/modern/ModernTypingHero";
import { ModernHeroAtmosphere } from "../../components/modern/ModernHeroAtmosphere";
import {
  ModernDraggableCaseStudyCard,
  useCaseStudyReorderSave,
} from "../../components/modern/ModernDraggableCaseStudyCard";
import { ModernCaseStudyCard } from "../../components/modern/ModernCaseStudyCard";
import { ModernFooter } from "../../components/modern/ModernFooter";
import {
  ModernHomeHeroEditorPanel,
  useModernHomeHeroEditor,
} from "../../components/home/ModernHomeHeroEditorPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { usePublicHomePageContent } from "../../hooks/usePublicHomePageContent";
import { useSEO } from "../../hooks/useSEO";
import { useProjects } from "../../contexts/ProjectsContext";
import {
  useModernCaseStudies,
  layoutCaseStudiesForGrid,
  modernCaseStudyCardLayout,
  mapRowToModernProjectData,
} from "../../lib/modernCaseStudies";
import { defaultBioDocument, healDegenerateHeroBio, type HomePageContentV2 } from "../../lib/homePageContent";
import { getProjectCardFrame } from "../../lib/projectHeroFrame";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";
import { supabase } from "../../lib/supabaseClient";
import { lazyWithRetry } from "../../utils/lazyWithRetry";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

const UnifiedProjectCreator = lazyWithRetry(() =>
  import("../../components/UnifiedProjectCreator").then((m) => ({
    default: m.UnifiedProjectCreator,
  })),
);

interface ModernHomeProps {
  onStartClick: () => void;
  onProjectClick: (project: ProjectData, updateCallback: (project: ProjectData) => void) => void;
  onNavigateContact: () => void;
  isEditMode?: boolean;
  onProjectUpdate?: (project: ProjectData) => void | Promise<void>;
}

type CropDraft = { scale: number; position: { x: number; y: number } };

interface ModernHomeViewProps extends ModernHomeProps {
  homePageContent: HomePageContentV2;
  homeContentLoading: boolean;
  onEditHomeContent?: () => void;
}

function ModernHomeView({
  onStartClick,
  onProjectClick,
  onNavigateContact,
  isEditMode = false,
  onProjectUpdate,
  homePageContent,
  homeContentLoading,
  onEditHomeContent,
}: ModernHomeViewProps) {
  const { fullName } = usePortfolioProfileNav();
  const {
    projects,
    loading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    reorderProjects,
  } = useProjects();
  const caseStudies = useModernCaseStudies(projects, projectsLoading, isEditMode);
  const { queueSave, flushSave } = useCaseStudyReorderSave();

  const [filter, setFilter] = useState<string>("all");
  const [localCaseStudiesOrder, setLocalCaseStudiesOrder] = useState<ProjectData[] | null>(null);
  const [showUnifiedProjectCreator, setShowUnifiedProjectCreator] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    projectId: string;
    projectTitle: string;
  } | null>(null);
  const userOverrideRef = useRef(false);
  const prevDefaultCaseStudyFilterRef = useRef<string | undefined>(undefined);
  const [croppingProjectId, setCroppingProjectId] = useState<string | null>(null);
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const cropProjectRef = useRef<ProjectData | null>(null);

  useEffect(() => {
    if (!isEditMode) setLocalCaseStudiesOrder(null);
  }, [isEditMode]);

  const applyTypeFilter = useCallback(
    (list: ProjectData[]) => {
      if (filter === "all") return list;
      const typeMatches = list.filter((p) => {
        const t = p.projectType || (p as { project_type?: string }).project_type;
        return t === filter;
      });
      if (!isEditMode) return typeMatches;
      // Edit mode: always surface drafts even when a category chip is active.
      const drafts = list.filter((p) => !p.published);
      const ids = new Set(typeMatches.map((p) => p.id));
      for (const draft of drafts) ids.add(draft.id);
      return list.filter((p) => ids.has(p.id));
    },
    [filter, isEditMode],
  );

  const displayList = useMemo(() => {
    const source = localCaseStudiesOrder ?? caseStudies;
    return applyTypeFilter(source);
  }, [localCaseStudiesOrder, caseStudies, applyTypeFilter]);

  const orderableCaseStudies = useMemo(
    () => localCaseStudiesOrder ?? caseStudies,
    [localCaseStudiesOrder, caseStudies],
  );

  const visibleFilters = useMemo(() => {
    if (isEditMode) return homePageContent.ui.caseStudyFilters;
    const types = new Set<string>();
    caseStudies.forEach((p) => {
      const t = p.projectType || (p as { project_type?: string }).project_type;
      if (t) types.add(t);
    });
    return homePageContent.ui.caseStudyFilters.filter((f) => types.has(f.id));
  }, [isEditMode, caseStudies, homePageContent.ui.caseStudyFilters]);

  useEffect(() => {
    if (
      filter !== "all" &&
      !visibleFilters.some((f) => f.id === filter)
    ) {
      setFilter("all");
    }
  }, [filter, visibleFilters]);

  useEffect(() => {
    if (homeContentLoading) return;
    const df = homePageContent.ui.defaultCaseStudyFilter ?? "all";
    if (
      prevDefaultCaseStudyFilterRef.current !== undefined &&
      prevDefaultCaseStudyFilterRef.current !== df
    ) {
      userOverrideRef.current = false;
    }
    prevDefaultCaseStudyFilterRef.current = df;

    if (userOverrideRef.current) return;

    let next: string = df === "all" ? "all" : df;
    if (next !== "all" && !visibleFilters.some((f) => f.id === next)) {
      next = "all";
    }
    setFilter(next);
  }, [homeContentLoading, homePageContent.ui.defaultCaseStudyFilter, visibleFilters]);

  const filtered = displayList;

  const previewGrid = useMemo(
    () => layoutCaseStudiesForGrid(filtered, homePageContent.ui.featuredCaseStudyId),
    [filtered, homePageContent.ui.featuredCaseStudyId],
  );

  const moveCaseStudy = useCallback(
    (dragId: string, hoverId: string) => {
      setLocalCaseStudiesOrder((currentOrder) => {
        const order = currentOrder ?? orderableCaseStudies;
        const dragIndex = order.findIndex((p) => p.id === dragId);
        const hoverIndex = order.findIndex((p) => p.id === hoverId);
        if (dragIndex === -1 || hoverIndex === -1 || dragIndex === hoverIndex) return currentOrder;

        const newOrder = [...order];
        const [dragged] = newOrder.splice(dragIndex, 1);
        newOrder.splice(hoverIndex, 0, dragged);
        const withSort = newOrder.map((p, index) => ({ ...p, sortOrder: index }));

        queueSave(withSort, async (ids) => {
          const ok = await reorderProjects(ids);
          if (!ok) toast.error("Could not save case study order.");
          return ok;
        });

        return withSort;
      });
    },
    [orderableCaseStudies, queueSave, reorderProjects],
  );

  const handleSaveOrderOnDragEnd = useCallback(() => {
    flushSave(async (ids) => {
      const ok = await reorderProjects(ids);
      if (!ok) toast.error("Could not save case study order.");
      return ok;
    });
  }, [flushSave, reorderProjects]);

  const handleTogglePublish = useCallback(
    async (project: ProjectData) => {
      const next = !project.published;
      const saved = await updateProject(project.id, { published: next });
      if (saved) {
        toast.success(next ? "Case study published." : "Case study moved to drafts.");
      } else {
        toast.error("Could not update publish status.");
      }
    },
    [updateProject],
  );

  const handleTogglePasswordProtection = useCallback(
    async (project: ProjectData) => {
      const current = Boolean(
        project.requiresPassword ?? (project as { requires_password?: boolean }).requires_password,
      );
      const next = !current;
      const saved = await updateProject(project.id, { requires_password: next });
      if (saved) {
        setLocalCaseStudiesOrder((order) =>
          order
            ? order.map((p) => (p.id === project.id ? { ...p, requiresPassword: next } : p))
            : order,
        );
        toast.success(next ? "Password protection enabled." : "Password protection removed.");
      } else {
        toast.error("Could not update password protection.");
      }
    },
    [updateProject],
  );

  const handleDuplicateProject = useCallback(
    async (projectId: string) => {
      const duplicated = await duplicateProject(projectId);
      if (duplicated) {
        setLocalCaseStudiesOrder(null);
        toast.success(`Created draft copy: "${duplicated.title}"`);
      } else {
        toast.error("Could not duplicate case study.");
      }
    },
    [duplicateProject],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return;
    const ok = await deleteProject(deleteConfirmation.projectId);
    if (ok) {
      setLocalCaseStudiesOrder(null);
      toast.success("Case study deleted.");
    } else {
      toast.error("Could not delete case study.");
    }
    setDeleteConfirmation(null);
  }, [deleteConfirmation, deleteProject]);

  const handleCreateUnifiedProject = useCallback(
    async (projectData: Record<string, unknown>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          toast.error("Sign in to create case studies.");
          return;
        }

        const createdProject = await createProject({
          user_id: user.id,
          title: String(projectData.title ?? "New case study"),
          description: String(projectData.description ?? ""),
          url: String(projectData.url ?? ""),
          position_x: Number((projectData.position as { x?: number })?.x ?? 50),
          position_y: Number((projectData.position as { y?: number })?.y ?? 50),
          scale: Number(projectData.scale ?? 1),
          published: Boolean(projectData.published ?? false),
          requires_password: Boolean(projectData.requires_password ?? false),
          password: projectData.password as string | undefined,
          case_study_content: String(projectData.caseStudyContent ?? ""),
          case_study_images: (projectData.caseStudyImages as unknown[]) ?? [],
          flow_diagram_images: (projectData.flowDiagramImages as unknown[]) ?? [],
          video_items: (projectData.videoItems as unknown[]) ?? [],
          gallery_aspect_ratio: String(projectData.galleryAspectRatio ?? "3x4"),
          flow_diagram_aspect_ratio: String(projectData.flowDiagramAspectRatio ?? "3x4"),
          video_aspect_ratio: String(projectData.videoAspectRatio ?? "3x4"),
          gallery_columns: Number(projectData.galleryColumns ?? 1),
          flow_diagram_columns: Number(projectData.flowDiagramColumns ?? 1),
          video_columns: Number(projectData.videoColumns ?? 1),
          project_images_position: (projectData.projectImagesPosition as string | null) ?? null,
          videos_position: (projectData.videosPosition as string | null) ?? null,
          flow_diagrams_position: (projectData.flowDiagramsPosition as string | null) ?? null,
          solution_cards_position: (projectData.solutionCardsPosition as string | null) ?? null,
          section_positions: (projectData.sectionPositions as Record<string, unknown>) ?? {},
          sort_order: 0,
          project_type: (projectData.project_type ?? projectData.projectType ?? null) as string | null,
        });

        if (!createdProject) {
          toast.error("Could not create case study.");
          return;
        }

        setShowUnifiedProjectCreator(false);
        setLocalCaseStudiesOrder(null);
        const normalized = mapRowToModernProjectData(createdProject);
        onProjectClick(normalized, () => {});
      } catch {
        toast.error("Could not create case study.");
      }
    },
    [createProject, onProjectClick],
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

  const saveCrop = useCallback(async () => {
    const base = cropProjectRef.current;
    if (!base || !cropDraft) {
      cancelCrop();
      return;
    }
    const position = {
      x: Math.round(cropDraft.position.x * 10) / 10,
      y: Math.round(cropDraft.position.y * 10) / 10,
    };
    const scale = Math.round(cropDraft.scale * 100) / 100;

    try {
      const saved = await updateProject(base.id, {
        position_x: position.x,
        position_y: position.y,
        scale,
      });
      if (!saved) {
        toast.error("Cover crop did not save. Check that you are signed in.");
        return;
      }
      onProjectUpdate?.({
        ...base,
        scale,
        position,
      });
      cancelCrop();
    } catch {
      toast.error("Cover crop did not save. Please try again.");
    }
  }, [cropDraft, cancelCrop, updateProject, onProjectUpdate]);

  const renderCard = (project: ProjectData, layout: "regular" | "wide", index?: number) => {
    const isCropping = croppingProjectId === project.id;
    const common = {
      project,
      layout,
      isEditMode,
      isCropping,
      cropDraft: isCropping ? cropDraft ?? undefined : undefined,
      onStartCrop: () => startCrop(project),
      onCropDraftChange: isCropping ? setCropDraft : undefined,
      onCropDone: saveCrop,
      onCropCancel: cancelCrop,
      onEditCaseStudy: () => handleEditCaseStudy(project),
      onTogglePublish: isEditMode ? () => void handleTogglePublish(project) : undefined,
      onTogglePasswordProtection: isEditMode
        ? () => void handleTogglePasswordProtection(project)
        : undefined,
      onDuplicate: isEditMode ? () => void handleDuplicateProject(project.id) : undefined,
      onDelete: isEditMode
        ? () => setDeleteConfirmation({ projectId: project.id, projectTitle: project.title })
        : undefined,
    };

    if (isEditMode && index !== undefined) {
      return (
        <ModernDraggableCaseStudyCard
          key={project.id}
          index={index}
          onMove={moveCaseStudy}
          onSaveOrderOnDragEnd={handleSaveOrderOnDragEnd}
          {...common}
        />
      );
    }

    return (
      <ModernCaseStudyCard
        key={project.id}
        {...common}
        onClick={() => handleProject(project)}
      />
    );
  };

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <section
        className={`modern-hero-section relative overflow-hidden ${modernLayout.sectionX} ${modernLayout.heroPt} ${modernLayout.heroPb}`}
      >
        <ModernHeroAtmosphere />
        <div className={`relative z-[1] ${modernLayout.container}`}>
          <div className="max-w-3xl min-w-0">
            {isEditMode && onEditHomeContent ? (
              <div className="mb-6">
                <button
                  type="button"
                  className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
                  style={modernFont}
                  onClick={onEditHomeContent}
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden />
                  Edit home content
                </button>
              </div>
            ) : null}

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
                {heroText.buttonText?.trim() || "About Brian"}
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={onNavigateContact}
                className="modern-btn-outline"
                style={modernFont}
              >
                {homePageContent.ui.contactCtaLabel?.trim() || "Get in touch"}
              </button>
            </div>
          </div>
        </div>
      </section>

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

      <section id="case-studies" className="scroll-mt-20">
        <div className={modernLayout.dividerBand}>
          <div className={modernLayout.sectionX}>
            <div className={`${modernLayout.container} flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6`}>
              <h2 style={{ ...modernFont, fontWeight: 600, fontSize: "1.125rem", color: modern.text }}>
                {homePageContent.ui.caseStudiesTitle || "Case studies"}
              </h2>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {isEditMode ? (
                  <button
                    type="button"
                    className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
                    style={modernFont}
                    onClick={() => setShowUnifiedProjectCreator(true)}
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden />
                    New case study
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    userOverrideRef.current = true;
                    setFilter("all");
                  }}
                  className={`modern-filter-chip${filter === "all" ? " modern-filter-chip--active" : ""}`}
                  style={modernFont}
                >
                  {homePageContent.ui.filterAll || "All"}
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
                Drafts are visible here only in edit mode. Drag the grip to reorder. Use{" "}
                <strong>Published / Draft</strong> to control visibility, or <strong>New case study</strong> to add
                one. Filter chips are edited in <strong>Edit home content</strong> → Case studies &amp; filters.
              </p>
            ) : null}
            {projectsLoading ? (
              <p className="text-sm" style={{ color: modern.muted }}>
                Loading case studies…
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm" style={{ color: modern.muted }}>
                {isEditMode
                  ? "No case studies match this filter. Create one with New case study."
                  : "No published case studies match this filter."}
              </p>
            ) : (
              <div className={modernLayout.cardGrid}>
                {isEditMode
                  ? filtered.map((project, index) =>
                      renderCard(
                        project,
                        modernCaseStudyCardLayout(index, filtered.length),
                        index,
                      ),
                    )
                  : (
                    <>
                      {previewGrid.featured
                        ? renderCard(previewGrid.featured, "wide")
                        : null}
                      {previewGrid.rest.map((project, i) => {
                        const isLast = i === previewGrid.rest.length - 1;
                        const isWide = isLast && previewGrid.rest.length % 2 === 1;
                        return renderCard(project, isWide ? "wide" : "regular");
                      })}
                    </>
                  )}
                {isEditMode ? (
                  <button
                    type="button"
                    className="modern-case-studies-add-card"
                    style={modernFont}
                    onClick={() => setShowUnifiedProjectCreator(true)}
                  >
                    <Plus className="w-8 h-8" style={{ color: modern.accent }} aria-hidden />
                    <span className="text-sm font-medium" style={{ color: modern.text }}>
                      New case study
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <ModernFooter />

      <AlertDialog open={Boolean(deleteConfirmation)} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete case study?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteConfirmation?.projectTitle}&rdquo;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditMode && showUnifiedProjectCreator ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: modern.bg }}>
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: modern.accent, borderTopColor: "transparent" }}
              />
            </div>
          }
        >
          <UnifiedProjectCreator
            isOpen={showUnifiedProjectCreator}
            onClose={() => setShowUnifiedProjectCreator(false)}
            onCreateProject={handleCreateUnifiedProject}
            isEditMode
          />
        </Suspense>
      ) : null}
    </main>
  );
}

function ModernHomePublic(props: ModernHomeProps) {
  const { homePageContent, loading } = usePublicHomePageContent();
  return (
    <ModernHomeView
      {...props}
      homePageContent={homePageContent}
      homeContentLoading={loading}
    />
  );
}

function ModernHomeEdit(props: ModernHomeProps) {
  const { heroEditorOpen, openHeroEditor, closeHeroEditor, cms } = useModernHomeHeroEditor();
  const {
    homePageContent,
    homeContentLoading,
    setHomePageContent,
    homeContentHydratedRef,
    persistHomePageNow,
    clearDebouncedHeroSave,
  } = cms;

  return (
    <>
      <ModernHomeView
        {...props}
        isEditMode
        homePageContent={homePageContent}
        homeContentLoading={homeContentLoading}
        onEditHomeContent={openHeroEditor}
      />
      <ModernHomeHeroEditorPanel
        open={heroEditorOpen}
        onClose={closeHeroEditor}
        homePageContent={homePageContent}
        setHomePageContent={setHomePageContent}
        homeContentHydratedRef={homeContentHydratedRef}
        persistHomePageNow={persistHomePageNow}
        clearDebouncedHeroSave={clearDebouncedHeroSave}
      />
    </>
  );
}

export function ModernHome(props: ModernHomeProps) {
  useSEO("home");
  if (props.isEditMode) {
    return <ModernHomeEdit {...props} />;
  }
  return <ModernHomePublic {...props} />;
}
