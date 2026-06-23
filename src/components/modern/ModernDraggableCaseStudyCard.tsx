import { useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { GripVertical } from "lucide-react";
import type { ProjectData } from "../ProjectImage";
import { ModernCaseStudyCard } from "./ModernCaseStudyCard";
import { modernFont } from "../../design/modernTokens";

const DND_TYPE = "modern-case-study";

interface ModernDraggableCaseStudyCardProps {
  project: ProjectData;
  index: number;
  layout: "regular" | "wide";
  isEditMode: boolean;
  onMove: (dragId: string, hoverId: string) => void;
  onSaveOrderOnDragEnd: () => void;
  isCropping: boolean;
  cropDraft?: { scale: number; position: { x: number; y: number } };
  onStartCrop: () => void;
  onCropDraftChange?: (draft: { scale: number; position: { x: number; y: number } }) => void;
  onCropDone?: () => void;
  onCropCancel?: () => void;
  onEditCaseStudy: () => void;
  onTogglePublish: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ModernDraggableCaseStudyCard({
  project,
  index,
  layout,
  isEditMode,
  onMove,
  onSaveOrderOnDragEnd,
  isCropping,
  cropDraft,
  onStartCrop,
  onCropDraftChange,
  onCropDone,
  onCropCancel,
  onEditCaseStudy,
  onTogglePublish,
  onDuplicate,
  onDelete,
}: ModernDraggableCaseStudyCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: () => ({ id: project.id, originalIndex: index }),
    canDrag: isEditMode && !isCropping,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => {
      setTimeout(() => onSaveOrderOnDragEnd(), 200);
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_TYPE,
    hover: (dragged: { id: string; originalIndex: number }, monitor) => {
      if (!ref.current || dragged.id === project.id) return;

      const rect = ref.current.getBoundingClientRect();
      const middleX = (rect.right - rect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const clientX = clientOffset.x - rect.left;

      if (dragged.originalIndex < index && clientX < middleX) return;
      if (dragged.originalIndex > index && clientX > middleX) return;

      onMove(dragged.id, project.id);
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  drag(dragHandleRef);
  drop(ref);

  return (
    <div
      ref={ref}
      className={`modern-case-study-dnd${layout === "wide" ? " modern-case-study-dnd--wide" : ""}${
        isDragging ? " modern-case-study-dnd--dragging" : ""
      }${isOver ? " modern-case-study-dnd--over" : ""}`}
      style={{ opacity: isDragging ? 0.55 : 1 }}
    >
      {isEditMode ? (
        <button
          ref={dragHandleRef}
          type="button"
          className="modern-case-study-dnd__handle"
          style={modernFont}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" aria-hidden />
        </button>
      ) : null}
      <ModernCaseStudyCard
        project={project}
        layout={layout}
        onClick={() => {}}
        isEditMode={isEditMode}
        isCropping={isCropping}
        cropDraft={cropDraft}
        onStartCrop={onStartCrop}
        onCropDraftChange={onCropDraftChange}
        onCropDone={onCropDone}
        onCropCancel={onCropCancel}
        onEditCaseStudy={onEditCaseStudy}
        onTogglePublish={onTogglePublish}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
  );
}

export function useCaseStudyReorderSave() {
  const latestOrderRef = useRef<ProjectData[] | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueSave = useCallback(
    (order: ProjectData[], save: (ids: string[]) => Promise<boolean>) => {
      latestOrderRef.current = order;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const ids = (latestOrderRef.current ?? order).map((p) => p.id);
        void save(ids);
      }, 300);
    },
    [],
  );

  const flushSave = useCallback((save: (ids: string[]) => Promise<boolean>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (latestOrderRef.current) {
      void save(latestOrderRef.current.map((p) => p.id));
    }
  }, []);

  return { queueSave, flushSave, latestOrderRef };
}
