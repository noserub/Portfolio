export const FONT_THEME_IDS = [
  "modern-default",
  "classic-contrast",
  "editorial",
  "swiss",
  "warm",
] as const;

export type FontThemeId = (typeof FONT_THEME_IDS)[number];

export const DEFAULT_FONT_THEME_ID: FontThemeId = "modern-default";

export interface FontThemeDefinition {
  id: FontThemeId;
  label: string;
  description: string;
  googleFontsUrl: string;
}

export const FONT_THEMES: Record<FontThemeId, FontThemeDefinition> = {
  "modern-default": {
    id: "modern-default",
    label: "Modern Default",
    description: "Clean Inter throughout",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
  "classic-contrast": {
    id: "classic-contrast",
    label: "Classic Contrast",
    description: "Montserrat headings, Inter body",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800&display=swap",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    description: "Serif headlines with crisp sans body",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
  },
  swiss: {
    id: "swiss",
    label: "Swiss Minimal",
    description: "Geometric sans, product-forward",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
  },
  warm: {
    id: "warm",
    label: "Warm Human",
    description: "Friendly, approachable sans",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
};

export const FONT_THEME_LIST = FONT_THEME_IDS.map((id) => FONT_THEMES[id]);

export function parseFontThemeId(value: unknown): FontThemeId | null {
  if (typeof value !== "string") return null;
  return FONT_THEME_IDS.includes(value as FontThemeId) ? (value as FontThemeId) : null;
}
