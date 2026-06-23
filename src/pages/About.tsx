import { useDesignVariant } from "../design/DesignVariantContext";
import { ClassicAbout } from "./classic/ClassicAbout";
import { ModernAbout } from "./modern/ModernAbout";

interface AboutProps {
  onBack: () => void;
  onHoverChange?: (isHovering: boolean) => void;
  isEditMode?: boolean;
  onNavigateContact: () => void;
}

export function About({ onBack, onHoverChange, isEditMode, onNavigateContact }: AboutProps) {
  const { effectiveVariant, publishedVariant } = useDesignVariant();
  const isModernSite = publishedVariant === "modern";

  if (isModernSite) {
    return (
      <ModernAbout
        onNavigateContact={onNavigateContact}
        onBack={onBack}
        isEditMode={isEditMode}
      />
    );
  }

  if (!isEditMode && effectiveVariant(false) === "modern") {
    return <ModernAbout onNavigateContact={onNavigateContact} onBack={onBack} />;
  }

  return (
    <ClassicAbout onBack={onBack} onHoverChange={onHoverChange} isEditMode={isEditMode} />
  );
}

export default About;
