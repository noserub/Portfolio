import { forwardRef, useCallback, useRef } from "react";
import { ArrowRight, ArrowUpRight, Copy, Crop, Edit2, Lock, Trash2 } from "lucide-react";
import type { ProjectData } from "../ProjectImage";
import { projectTypeTag } from "../../lib/modernCaseStudies";
import { croppedCardImageStyle, computeCardFitToFrameScale, getProjectCardFrame } from "../../lib/projectHeroFrame";
import { modern, modernFont } from "../../design/modernTokens";
import { CardImageCropControls } from "./CardImageCropControls";

interface ModernCaseStudyCardProps {
  project: ProjectData;
  onClick: () => void;
  /** Full-width horizontal card (featured hero or last item when remainder count is odd). */
  layout?: "regular" | "wide";
  isEditMode?: boolean;
  isCropping?: boolean;
  cropDraft?: { scale: number; position: { x: number; y: number } };
  onStartCrop?: () => void;
  onCropDraftChange?: (draft: { scale: number; position: { x: number; y: number } }) => void;
  onCropDone?: () => void;
  onCropCancel?: () => void;
  onEditCaseStudy?: () => void;
  onTogglePublish?: () => void;
  onTogglePasswordProtection?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function CaseStudyProtectedBadge() {
  return (
    <span className="modern-case-study-card__protected-badge">
      <Lock size={11} strokeWidth={2} aria-hidden />
      Protected
    </span>
  );
}

const CaseStudyCardImage = forwardRef<
  HTMLDivElement,
  {
    project: ProjectData;
    title: string;
    requiresPassword?: boolean;
    cropFrame: { scale: number; position: { x: number; y: number } };
    isCropping?: boolean;
    onCropDrag?: (position: { x: number; y: number }) => void;
    cropOverlay?: React.ReactNode;
  }
>(function CaseStudyCardImage(
  { project, title, requiresPassword, cropFrame, isCropping, onCropDrag, cropOverlay },
  forwardedRef,
) {
  const cover = project.url;
  const mediaRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setMediaRef = useCallback(
    (node: HTMLDivElement | null) => {
      mediaRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCropping || !onCropDrag) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isCropping || !onCropDrag || !draggingRef.current || !mediaRef.current) return;
    e.preventDefault();
    const rect = mediaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onCropDrag({ x, y });
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      ref={setMediaRef}
      className={`modern-case-study-card__image${isCropping ? " modern-case-study-card__image--cropping" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {cover ? (
        <img
          src={cover}
          alt={title}
          className="w-full h-full pointer-events-none select-none"
          style={croppedCardImageStyle(cropFrame.scale, cropFrame.position)}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: modern.muted }}>
          No preview
        </div>
      )}
      {requiresPassword && !isCropping ? <CaseStudyProtectedBadge /> : null}
      {cropOverlay}
    </div>
  );
});

export function ModernCaseStudyCard({
  project,
  onClick,
  layout = "regular",
  isEditMode = false,
  isCropping = false,
  cropDraft,
  onStartCrop,
  onCropDraftChange,
  onCropDone,
  onCropCancel,
  onEditCaseStudy,
  onTogglePublish,
  onTogglePasswordProtection,
  onDuplicate,
  onDelete,
}: ModernCaseStudyCardProps) {
  const isWide = layout === "wide";
  const tag = projectTypeTag(project);
  const requiresPassword = Boolean(
    project.requiresPassword ?? (project as { requires_password?: boolean }).requires_password,
  );
  const frame = cropDraft ?? getProjectCardFrame(project);
  const cropImageRef = useRef<HTMLDivElement>(null);

  const handleCropDrag = useCallback(
    (position: { x: number; y: number }) => {
      onCropDraftChange?.({ scale: frame.scale, position });
    },
    [frame.scale, onCropDraftChange],
  );

  const handleReset = useCallback(() => {
    onCropDraftChange?.({ scale: 1, position: { x: 50, y: 50 } });
  }, [onCropDraftChange]);

  const handleFitToFrame = useCallback(() => {
    const container = cropImageRef.current;
    if (!container || !onCropDraftChange) return;

    const applyFit = (img: HTMLImageElement) => {
      const rect = container.getBoundingClientRect();
      const scale = computeCardFitToFrameScale(
        rect.width,
        rect.height,
        img.naturalWidth,
        img.naturalHeight,
      );
      onCropDraftChange({ scale, position: { x: 50, y: 50 } });
    };

    const img = container.querySelector("img");
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      applyFit(img);
      return;
    }
    img.addEventListener("load", () => applyFit(img), { once: true });
  }, [onCropDraftChange]);

  const cropOverlay =
    isCropping && onCropDone && onCropCancel ? (
      <CardImageCropControls
        variant="overlay"
        scale={frame.scale}
        onScaleChange={(scale) => onCropDraftChange?.({ scale, position: frame.position })}
        onFitToFrame={handleFitToFrame}
        onReset={handleReset}
        onDone={onCropDone}
        onCancel={onCropCancel}
      />
    ) : null;

  const cardClass = `group modern-case-study-card${isWide ? " modern-case-study-card--wide" : ""}${
    isEditMode ? " modern-case-study-card--edit" : ""
  }${isEditMode && !project.published ? " modern-case-study-card--draft" : ""}${
    isCropping ? " modern-case-study-card--cropping" : ""
  }`;

  const mediaColumn = (
    <div className="modern-case-study-card__media-col">
      <CaseStudyCardImage
        ref={cropImageRef}
        project={project}
        title={project.title}
        requiresPassword={requiresPassword}
        cropFrame={frame}
        isCropping={isCropping}
        onCropDrag={isCropping ? handleCropDrag : undefined}
        cropOverlay={cropOverlay}
      />
    </div>
  );

  const editBar =
    isEditMode && !isCropping ? (
      <div
        className={`modern-case-study-card__edit-bar${isWide ? " modern-case-study-card__edit-bar--wide-inline" : ""}`}
        role="toolbar"
        aria-label="Case study card actions"
      >
        <button
          type="button"
          className="modern-case-study-card__edit-btn"
          style={modernFont}
          onClick={(e) => {
            e.stopPropagation();
            onStartCrop?.();
          }}
        >
          <Crop className="w-3.5 h-3.5" aria-hidden />
          Adjust cover
        </button>
        <button
          type="button"
          className="modern-case-study-card__edit-btn modern-case-study-card__edit-btn--primary"
          style={modernFont}
          onClick={(e) => {
            e.stopPropagation();
            onEditCaseStudy?.();
          }}
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden />
          Edit case study
        </button>
        {onTogglePublish ? (
          <button
            type="button"
            className={`modern-case-study-card__edit-btn${project.published ? " modern-case-study-card__edit-btn--published" : ""}`}
            style={modernFont}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublish();
            }}
          >
            {project.published ? "Published" : "Draft"}
          </button>
        ) : null}
        {onTogglePasswordProtection ? (
          <button
            type="button"
            className={`modern-case-study-card__edit-btn${requiresPassword ? " modern-case-study-card__edit-btn--protected" : ""}`}
            style={modernFont}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePasswordProtection();
            }}
            title={requiresPassword ? "Password required to view" : "No password required"}
          >
            <Lock className="w-3.5 h-3.5" aria-hidden />
            {requiresPassword ? "Protected" : "Public"}
          </button>
        ) : null}
        {onDuplicate ? (
          <button
            type="button"
            className="modern-case-study-card__edit-btn"
            style={modernFont}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3.5 h-3.5" aria-hidden />
            Duplicate
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="modern-case-study-card__edit-btn modern-case-study-card__edit-btn--danger"
            style={modernFont}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
    ) : null;

  const bodyContent = isWide ? (
    <div className="flex-1 flex flex-col justify-center p-5 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="modern-eyebrow mb-2" style={modernFont}>
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
          {!isEditMode ? (
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
          ) : null}
        </div>
        {!isEditMode ? (
          <ArrowUpRight
            size={14}
            className="shrink-0 mt-0.5 text-[#666666] modern-icon-accent-hover transition-colors"
          />
        ) : null}
      </div>
      {editBar}
    </div>
  ) : (
    <div className="modern-case-study-card__body">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="modern-eyebrow mb-1.5" style={modernFont}>
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
        {!isEditMode ? (
          <ArrowUpRight
            size={14}
            className="shrink-0 mt-1 text-[#666666] modern-icon-accent-hover transition-colors"
          />
        ) : null}
      </div>
    </div>
  );

  if (isEditMode) {
    return (
      <div className={cardClass}>
        {mediaColumn}
        {bodyContent}
        {!isWide && !isCropping ? editBar : null}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cardClass}>
      {mediaColumn}
      {bodyContent}
    </button>
  );
}
