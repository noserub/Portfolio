import { useDesignVariant } from "../design/DesignVariantContext";
import ClassicHome from "./classic/ClassicHome";
import { ModernHome } from "./modern/ModernHome";
import type { ProjectData } from "../components/ProjectImage";

interface HomeProps {
  onStartClick: () => void;
  isEditMode: boolean;
  onProjectClick: (project: ProjectData, updateCallback: (project: ProjectData) => void) => void;
  onProjectUpdate?: (project: ProjectData) => void | Promise<void>;
  currentPage: string;
  onNavigateContact: () => void;
}

export function Home({
  onStartClick,
  isEditMode,
  onProjectClick,
  onProjectUpdate,
  currentPage,
  onNavigateContact,
}: HomeProps) {
  const { effectiveVariant } = useDesignVariant();
  const variant = effectiveVariant(isEditMode);

  if (variant === "modern") {
    return (
      <ModernHome
        onStartClick={onStartClick}
        onProjectClick={onProjectClick}
        onNavigateContact={onNavigateContact}
        isEditMode={isEditMode}
        onProjectUpdate={onProjectUpdate}
      />
    );
  }

  return (
    <ClassicHome
      onStartClick={onStartClick}
      isEditMode={isEditMode}
      onProjectClick={onProjectClick}
      currentPage={currentPage}
    />
  );
}

export default Home;
