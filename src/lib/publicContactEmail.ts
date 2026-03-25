/**
 * Public contact email for footer mailto, Contact page defaults, and profile inserts when session has no email.
 * Prefer VITE_PUBLIC_CONTACT_EMAIL; fall back to owner sign-in email (same person on a single-owner site).
 */
export function getPublicContactEmail(): string {
  const explicit = import.meta.env.VITE_PUBLIC_CONTACT_EMAIL?.trim();
  if (explicit) return explicit;
  return import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim() || "";
}
