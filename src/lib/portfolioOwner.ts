/**
 * Single canonical auth user id for the published portfolio (profiles.id, app_settings.user_id, etc.).
 * Anonymous visitors load this row; set VITE_PUBLIC_PORTFOLIO_OWNER_ID in Vercel Preview/Production
 * to match your Supabase auth user id so edits and public reads use the same data.
 */
const DEFAULT_PORTFOLIO_OWNER_ID = "7cd2752f-93c5-46e6-8535-32769fb10055";

export function getPortfolioOwnerUserId(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_PORTFOLIO_OWNER_ID;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return DEFAULT_PORTFOLIO_OWNER_ID;
}
