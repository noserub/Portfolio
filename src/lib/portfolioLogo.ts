/** Canonical BB mark — same asset as classic header / app_settings.logo_url default. */
export const DEFAULT_PORTFOLIO_LOGO_URL = "/snapshot/BrB-black.png";

export function resolvePortfolioLogoUrl(url?: string | null): string {
  const trimmed = url?.trim();
  return trimmed || DEFAULT_PORTFOLIO_LOGO_URL;
}
