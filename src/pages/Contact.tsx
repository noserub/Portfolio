import { useDesignVariant } from "../design/DesignVariantContext";
import { ClassicContact } from "./classic/ClassicContact";
import { ModernContact } from "./modern/ModernContact";

interface ContactProps {
  onBack: () => void;
  isEditMode?: boolean;
}

export function Contact({ onBack, isEditMode = false }: ContactProps) {
  const { effectiveVariant } = useDesignVariant();
  const variant = effectiveVariant(isEditMode);

  if (variant === "modern") {
    return <ModernContact onBack={onBack} />;
  }

  return <ClassicContact onBack={onBack} isEditMode={isEditMode} />;
}

export default Contact;
