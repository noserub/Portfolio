import { useCallback, useRef } from "react";
import { ArrowRight, ArrowUpRight, Crop, Edit2, Lock } from "lucide-react";
import type { ProjectData } from "../ProjectImage";
import { projectTypeTag } from "../../lib/modernCaseStudies";
import { croppedImageStyle, getProjectCardFrame } from "../../lib/projectHeroFrame";
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
  cropFrame,
  isCropping,
  onCropDrag,
}: {
  project: ProjectData;
  title: string;
  requiresPassword?: boolean;
  cropFrame: { scale: number; position: { x: number; y: number } };
  isCropping?: boolean;
  onCropDrag?: (position: { x: number; y: number }) => void;
}) {
  const cover = project.url;
  const mediaRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

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
      ref={mediaRef}
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
          style={croppedImageStyle(cropFrame.scale, cropFrame.position)}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: modern.muted }}>
          No preview
        </div>
      )}
      {requiresPassword && !isCropping ? <CaseStudyProtectedBadge /> : null}
    </div>
  );
}

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
}: ModernCaseStudyCardProps) {
  const isWide = layout === "wide";
  const tag = projectTypeTag(project);
  const requiresPassword = Boolean(project.requiresPassword);
  const frame = cropDraft ?? getProjectCardFrame(project);

  const handleCropDrag = useCallback(
    (position: { x: number; y: number }) => {
      onCropDraftChange?.({ scale: frame.scale, position });
    },
    [frame.scale, onCropDraftChange],
  );

  const handleReset = useCallback(() => {
    onCropDraftChange?.({ scale: 1, position: { x: 50, y: 50 } });
  }, [onCropDraftChange]);

  const cardClass = `group modern-case-study-card${isWide ? " modern-case-study-card--wide" : ""}${
    isEditMode ? " modern-case-study-card--edit" : ""
  }${isCropping ? " modern-case-study-card--cropping" : ""}`;

  const mediaColumn = (
    <div className="modern-case-study-card__media-col">
      <CaseStudyCardImage
        project={project}
        title={project.title}
        requiresPassword={requiresPassword}
        cropFrame={frame}
        isCropping={isCropping}
        onCropDrag={isCropping ? handleCropDrag : undefined}
      />
      {isCropping && onCropDone && onCropCancel ? (
        <CardImageCropControls
          scale={frame.scale}
          onScaleChange={(scale) => onCropDraftChange?.({ scale, position: frame.position })}
          onReset={handleReset}
          onDone={onCropDone}
          onCancel={onCropCancel}
        />
      ) : null}
    </div>
  );

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

  const editBar =
    isEditMode && !isCropping ? (
      <div className="modern-case-study-card__edit-bar" role="toolbar" aria-label="Case study card actions">
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
      </div>
    ) : null;

  if (isEditMode) {
    return (
      <div className={cardClass}>
        {mediaColumn}
        {bodyContent}
        {editBar}
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
