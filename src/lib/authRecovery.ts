/** Helpers for Supabase password-recovery redirects in this SPA. */

const PASSWORD_RECOVERY_FLAG = "sb-portfolio-password-recovery";
const CODE_VERIFIER_KEY = "sb-portfolio-code-verifier";

/** True when a Supabase auth redirect is a password recovery, not a magic link. */
export function isPasswordRecoveryUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const hashType = new URLSearchParams(url.hash.replace(/^#/, "")).get("type");
    const queryType = url.searchParams.get("type");
    return hashType === "recovery" || queryType === "recovery";
  } catch {
    return false;
  }
}

function readStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function urlHasAuthCallbackCode(href: string): boolean {
  try {
    return Boolean(new URL(href).searchParams.get("code"));
  } catch {
    return false;
  }
}

/**
 * PKCE stores `codeVerifier/recovery` before the email is clicked.
 * Only treat it as a live recovery callback when the current URL also has `?code=`.
 */
export function hasActivePasswordRecoveryCallback(): boolean {
  if (typeof window === "undefined") return false;
  if (isPasswordRecoveryUrl(window.location.href)) return true;

  if (!urlHasAuthCallbackCode(window.location.href)) return false;

  const raw = readStorageItem(CODE_VERIFIER_KEY);
  if (!raw) return false;
  const suffix = raw.split("/")[1]?.toLowerCase() ?? "";
  return suffix === "recovery" || suffix === "password_recovery";
}

export function markPendingPasswordRecovery(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, "1");
  } catch {
    /* ignore quota */
  }
}

/**
 * Remember a recovery redirect before the Supabase client starts.
 * Only mark pending when this navigation is an actual recovery callback.
 * Clear stale flags on normal loads so the set-password dialog does not reopen forever.
 */
export function capturePasswordRecoveryFromUrl(): void {
  if (typeof window === "undefined") return;
  if (hasActivePasswordRecoveryCallback()) {
    markPendingPasswordRecovery();
    return;
  }
  clearPendingPasswordRecovery();
}

export function hasPendingPasswordRecovery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PASSWORD_RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearPendingPasswordRecovery(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
  } catch {
    /* ignore */
  }
}

export function hasRecoveryHashInUrl(): boolean {
  if (typeof window === "undefined") return false;
  return isPasswordRecoveryUrl(window.location.href);
}

export function clearSupabaseAuthHashFromUrl(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  const cleaned = new URLSearchParams(search);
  cleaned.delete("code");
  cleaned.delete("type");
  const nextSearch = cleaned.toString();
  window.history.replaceState(
    null,
    "",
    `${pathname}${nextSearch ? `?${nextSearch}` : ""}`,
  );
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
