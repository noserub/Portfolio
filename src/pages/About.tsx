import { useDesignVariant } from "../design/DesignVariantContext";
import { ClassicAbout } from "./classic/ClassicAbout";
import { ModernAbout } from "./modern/ModernAbout";

interface AboutProps {
  onBack: () => void;
  onHoverChange?: (isHovering: boolean) => void;
  isEditMode?: boolean;
  onNavigateContact: () => void;
  onNavigateDesignSystem?: () => void;
}

export function About({
  onBack,
  onHoverChange,
  isEditMode,
  onNavigateContact,
  onNavigateDesignSystem,
}: AboutProps) {
  const { effectiveVariant, publishedVariant } = useDesignVariant();
  const isModernSite = publishedVariant === "modern";

  if (isModernSite) {
    return (
      <ModernAbout
        onNavigateContact={onNavigateContact}
        onNavigateDesignSystem={onNavigateDesignSystem}
        onBack={onBack}
        isEditMode={isEditMode}
      />
    );
  }

  if (!isEditMode && effectiveVariant(false) === "modern") {
    return (
      <ModernAbout
        onNavigateContact={onNavigateContact}
        onNavigateDesignSystem={onNavigateDesignSystem}
        onBack={onBack}
      />
    );
  }

  return (
    <ClassicAbout onBack={onBack} onHoverChange={onHoverChange} isEditMode={isEditMode} />
  );
}

export default About;
