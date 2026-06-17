/** Canonical BB mark — same asset as classic header / app_settings.logo_url default. */
export const DEFAULT_PORTFOLIO_LOGO_URL =
  "https://ljapwsajftxltykmpsmz.supabase.co/storage/v1/object/public/portfolio-images/BrB-black.png";

export function resolvePortfolioLogoUrl(url?: string | null): string {
  const trimmed = url?.trim();
  return trimmed || DEFAULT_PORTFOLIO_LOGO_URL;
}
