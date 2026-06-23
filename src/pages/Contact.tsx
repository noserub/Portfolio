import { useDesignVariant } from "../design/DesignVariantContext";
import { ClassicContact } from "./classic/ClassicContact";
import { ModernContact } from "./modern/ModernContact";

interface ContactProps {
  onBack: () => void;
  isEditMode?: boolean;
}

export function Contact({ onBack, isEditMode = false }: ContactProps) {
  const { effectiveVariant, publishedVariant } = useDesignVariant();
  const isModernSite = publishedVariant === "modern";

  if (isModernSite) {
    return <ModernContact onBack={onBack} isEditMode={isEditMode} />;
  }

  if (!isEditMode && effectiveVariant(false) === "modern") {
    return <ModernContact onBack={onBack} />;
  }

  return <ClassicContact onBack={onBack} isEditMode={isEditMode} />;
}

export default Contact;
