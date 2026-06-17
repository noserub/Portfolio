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
  const { effectiveVariant } = useDesignVariant();
  const variant = effectiveVariant(Boolean(isEditMode));

  if (variant === "modern") {
    return <ModernAbout onNavigateContact={onNavigateContact} />;
  }

  return (
    <ClassicAbout onBack={onBack} onHoverChange={onHoverChange} isEditMode={isEditMode} />
  );
}

export default About;
