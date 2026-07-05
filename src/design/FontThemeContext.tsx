import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import { DEFAULT_FONT_THEME_ID, type FontThemeId } from "./fontThemes";
import { applyFontTheme } from "../lib/applyFontTheme";
import { loadPublishedFontTheme, savePublishedFontTheme } from "../lib/fontThemeSettings";

interface FontThemeContextValue {
  fontTheme: FontThemeId;
  fontThemeReady: boolean;
  setFontTheme: (themeId: FontThemeId) => void;
}

const FontThemeContext = createContext<FontThemeContextValue | null>(null);

export function FontThemeProvider({ children }: { children: React.ReactNode }) {
  const { isSupabaseAuthenticated } = useSiteAuth();
  const [fontTheme, setFontThemeState] = useState<FontThemeId>(DEFAULT_FONT_THEME_ID);
  const [fontThemeReady, setFontThemeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadPublishedFontTheme().then((themeId) => {
      if (cancelled) return;
      setFontThemeState(themeId);
      setFontThemeReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fontThemeReady) return;
    applyFontTheme(fontTheme);
  }, [fontTheme, fontThemeReady]);

  const setFontTheme = useCallback(
    (themeId: FontThemeId) => {
      setFontThemeState(themeId);
      if (!isSupabaseAuthenticated) return;

      void savePublishedFontTheme(themeId).then((result) => {
        if (result.ok) return;
        toast.error(
          result.reason === "not_signed_in"
            ? result.message
            : `Typography preset did not save: ${result.message}`,
        );
      });
    },
    [isSupabaseAuthenticated],
  );

  const value = useMemo(
    () => ({ fontTheme, fontThemeReady, setFontTheme }),
    [fontTheme, fontThemeReady, setFontTheme],
  );

  return <FontThemeContext.Provider value={value}>{children}</FontThemeContext.Provider>;
}

export function useFontTheme(): FontThemeContextValue {
  const ctx = useContext(FontThemeContext);
  if (!ctx) {
    throw new Error("useFontTheme must be used within FontThemeProvider");
  }
  return ctx;
}
