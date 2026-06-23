import type { ProjectData } from "../../components/ProjectImage";
import { ClassicProjectDetail } from "../classic/ClassicProjectDetail";
import { modern } from "../../design/modernTokens";
import { modernLayout } from "../../design/modernLayout";

interface ModernProjectDetailProps {
  project: ProjectData;
  onBack: () => void;
  onUpdate: (project: ProjectData) => void;
  isEditMode: boolean;
  onProjectDuplicated?: (copy: ProjectData) => void;
}

/** Reuses classic case study CMS body; modern editorial chrome via CSS + layout tokens. */
export function ModernProjectDetail(props: ModernProjectDetailProps) {
  return (
    <div
      data-modern-project-detail
      className={`${modernLayout.projectDetailShell} min-h-screen`}
      style={{ background: modern.bg }}
    >
      <ClassicProjectDetail {...props} />
    </div>
  );
}
