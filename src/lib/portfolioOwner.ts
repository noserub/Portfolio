/**
 * Single canonical auth user id for the published portfolio (profiles.id, app_settings.user_id, etc.).
 *
 * Resolution order:
 * 1. `VITE_PUBLIC_PORTFOLIO_OWNER_ID` — required for anonymous visitors to see the published row
 *    (set this in Vercel Production + Preview to your Supabase user UUID).
 * 2. Signed-in user's id — when env is missing (local dev / misconfigured deploy), load and save
 *    the same `profiles` row RLS allows, instead of a stale hardcoded default UUID.
 * 3. Legacy default UUID — last resort for unauthenticated sessions when env is unset.
 */
const DEFAULT_PORTFOLIO_OWNER_ID = "7cd2752f-93c5-46e6-8535-32769fb10055";

export function getPortfolioOwnerUserId(authenticatedUserId?: string | null): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_PORTFOLIO_OWNER_ID;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  if (typeof authenticatedUserId === "string" && authenticatedUserId.trim().length > 0) {
    return authenticatedUserId.trim();
  }
  return DEFAULT_PORTFOLIO_OWNER_ID;
}

/**
 * ID to use for Supabase `profiles` UPDATE/INSERT so RLS passes.
 *
 * `getPortfolioOwnerUserId` prefers `VITE_PUBLIC_PORTFOLIO_OWNER_ID` over the session id.
 * For **writes**, PostgREST requires `auth.uid() = profiles.id`. If env points at UUID B but
 * you are signed in as UUID A, updates targeting B fail silently (0 rows) — e.g. `resume_url`
 * never persists while other UI still “works” from local drafts.
 *
 * When a session exists, always use that user id for profile mutations. When there is no
 * session (anon + site password bypass), use the published owner id from env / legacy default
 * (requires matching RLS policy for that row).
 */
export function getProfileWriterUserId(authenticatedUserId?: string | null): string {
  if (typeof authenticatedUserId === "string" && authenticatedUserId.trim().length > 0) {
    return authenticatedUserId.trim();
  }
  return getPortfolioOwnerUserId(null);
}
