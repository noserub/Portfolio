import { useDesignVariant } from "../design/DesignVariantContext";
import type { ProjectData } from "../components/ProjectImage";
import { ClassicProjectDetail } from "./classic/ClassicProjectDetail";
import { ModernProjectDetail } from "./modern/ModernProjectDetail";

interface ProjectDetailProps {
  project: ProjectData;
  onBack: () => void;
  onUpdate: (project: ProjectData) => void;
  isEditMode: boolean;
  onProjectDuplicated?: (copy: ProjectData) => void;
}

export function ProjectDetail({ project, onBack, onUpdate, isEditMode, onProjectDuplicated }: ProjectDetailProps) {
  const { effectiveVariant } = useDesignVariant();
  const variant = effectiveVariant(isEditMode);

  if (variant === "modern") {
    return (
      <ModernProjectDetail
        project={project}
        onBack={onBack}
        onUpdate={onUpdate}
        isEditMode={isEditMode}
        onProjectDuplicated={onProjectDuplicated}
      />
    );
  }

  return (
    <ClassicProjectDetail
      project={project}
      onBack={onBack}
      onUpdate={onUpdate}
      isEditMode={isEditMode}
      onProjectDuplicated={onProjectDuplicated}
    />
  );
}

export default ProjectDetail;
