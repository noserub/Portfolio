import {
  DEFAULT_FONT_THEME_ID,
  FONT_THEMES,
  type FontThemeId,
} from "../design/fontThemes";

const FONT_LINK_ID = "portfolio-font-theme";

export function applyFontTheme(themeId: FontThemeId): void {
  const theme = FONT_THEMES[themeId] ?? FONT_THEMES[DEFAULT_FONT_THEME_ID];
  document.documentElement.dataset.fontTheme = theme.id;
  loadFontThemeStylesheet(theme.googleFontsUrl);
}

function loadFontThemeStylesheet(url: string): void {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== url) {
    link.href = url;
  }
}
