/** Helpers for Supabase password-recovery hash URLs in this SPA. */

export function hasRecoveryHashInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  return params.get("type") === "recovery";
}

export function clearSupabaseAuthHashFromUrl(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

export function isSupabaseConfigured(): boolean {
  const email = import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL;
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      typeof email === "string" &&
      email.trim().length > 0,
  );
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "QuotaExceededError") {
    return "Browser storage is full. The site cleared some local caches automatically; try signing in again.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return "Something went wrong. Please try again.";
}
