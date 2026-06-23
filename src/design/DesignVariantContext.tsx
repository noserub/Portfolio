import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import type { DesignVariant } from "../types";

const STORAGE_KEY = "designVariant";

function parseVariant(value: string | null | undefined): DesignVariant | null {
  if (value === "modern" || value === "classic") return value;
  return null;
}

/** Canonical design for anonymous visitors — set via VITE_DESIGN_VARIANT on deploy. */
export function resolvePublishedDesignVariant(): DesignVariant {
  return parseVariant(import.meta.env.VITE_DESIGN_VARIANT) ?? "modern";
}

/** Pages that still use classic CMS shells in edit mode (modern editors not ported yet). */
const CLASSIC_CMS_EDIT_PAGES = new Set<string>();

/**
 * `data-design` for CSS tokens — may differ from chrome on legacy CMS pages during edit.
 * Published variant is used for all pages in edit mode (WYSIWYG).
 */
export function resolvePageDesignVariant(
  isEditMode: boolean,
  currentPage: string,
  publishedVariant: DesignVariant,
  previewVariant: DesignVariant,
): DesignVariant {
  if (!isEditMode) return previewVariant;
  if (CLASSIC_CMS_EDIT_PAGES.has(currentPage)) return "classic";
  return publishedVariant;
}

interface DesignVariantContextValue {
  /** Owner preference when signed in; published variant when signed out. */
  designVariant: DesignVariant;
  /** No-op for signed-out visitors. */
  setDesignVariant: (variant: DesignVariant) => void;
  /** Edit mode → published (WYSIWYG); signed out → published; signed in → owner preference. */
  effectiveVariant: (isEditMode: boolean) => DesignVariant;
  publishedVariant: DesignVariant;
}

const DesignVariantContext = createContext<DesignVariantContextValue | null>(null);

export function DesignVariantProvider({ children }: { children: React.ReactNode }) {
  const { isSupabaseAuthenticated, isAuthInitialized } = useSiteAuth();
  const publishedVariant = useMemo(() => resolvePublishedDesignVariant(), []);
  const [ownerVariant, setOwnerVariantState] = useState<DesignVariant>(publishedVariant);

  useEffect(() => {
    if (!isAuthInitialized || !isSupabaseAuthenticated) return;
    const stored = parseVariant(localStorage.getItem(STORAGE_KEY));
    if (stored) setOwnerVariantState(stored);
  }, [isAuthInitialized, isSupabaseAuthenticated]);

  const designVariant = useMemo(() => {
    if (!isAuthInitialized) return publishedVariant;
    return isSupabaseAuthenticated ? ownerVariant : publishedVariant;
  }, [isAuthInitialized, isSupabaseAuthenticated, ownerVariant, publishedVariant]);

  const setDesignVariant = useCallback(
    (variant: DesignVariant) => {
      if (!isSupabaseAuthenticated) return;
      setOwnerVariantState(variant);
      try {
        localStorage.setItem(STORAGE_KEY, variant);
      } catch {
        /* ignore */
      }
    },
    [isSupabaseAuthenticated],
  );

  const effectiveVariant = useCallback(
    (isEditMode: boolean): DesignVariant => {
      if (isEditMode) return publishedVariant;
      if (!isAuthInitialized) return publishedVariant;
      return isSupabaseAuthenticated ? ownerVariant : publishedVariant;
    },
    [isAuthInitialized, isSupabaseAuthenticated, ownerVariant, publishedVariant],
  );

  const value = useMemo(
    () => ({ designVariant, setDesignVariant, effectiveVariant, publishedVariant }),
    [designVariant, setDesignVariant, effectiveVariant, publishedVariant],
  );

  return (
    <DesignVariantContext.Provider value={value}>{children}</DesignVariantContext.Provider>
  );
}

export function useDesignVariant(): DesignVariantContextValue {
  const ctx = useContext(DesignVariantContext);
  if (!ctx) {
    throw new Error("useDesignVariant must be used within DesignVariantProvider");
  }
  return ctx;
}
