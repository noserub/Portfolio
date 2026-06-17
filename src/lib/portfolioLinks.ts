/** Job-search LinkedIn profile (canonical for nav, footer, and JSON-LD). */
export const LINKEDIN_PROFILE_URL = "https://www.linkedin.com/in/bureson/";

export const GITHUB_PROFILE_URL = "https://github.com/noserub";

export const DEFAULT_OWNER_DISPLAY_NAME = "Brian Bureson";

export const RESUME_DOWNLOAD_FILENAME = "Brian-Bureson-Resume.pdf";

/** Correct common CMS typos and fall back when the profile name is missing or an email. */
export function normalizeOwnerDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes("@")) return DEFAULT_OWNER_DISPLAY_NAME;
  return trimmed.replace(/\bBunsen\b/gi, "Bureson");
}

function extractGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  const fileIdMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/) ??
    trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/) ??
    trimmed.match(/[?&]id=([^&]+)/);

  return fileIdMatch?.[1] ?? null;
}

/** Open Google Drive (or direct PDF) in a new tab for skim-first flows (nav, About). */
export function toResumeViewUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  return trimmed;
}

/**
 * Prefer a direct download for Google Drive resume links so visitors get a PDF prompt
 * instead of only the Drive preview UI.
 */
export function toResumeDownloadUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
}

import { PORTFOLIO_IMAGE_WELL_GRADIENT } from "./modernSurfaces";

export const CLASSIC_MEDIA_PLACEHOLDER_GRADIENT = PORTFOLIO_IMAGE_WELL_GRADIENT;

export function mediaPlaceholderBackground(isModernChrome: boolean, hasMedia: boolean): string {
  if (hasMedia) return "transparent";
  return isModernChrome ? "var(--modern-surface-inset)" : CLASSIC_MEDIA_PLACEHOLDER_GRADIENT;
}
