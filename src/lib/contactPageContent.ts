import { getPortfolioOwnerUserId } from "./portfolioOwner";
import { fetchPublishedResumeUrl } from "./aboutPageProfile";
import { getPublicContactEmail } from "./publicContactEmail";
import { LINKEDIN_PROFILE_URL } from "./portfolioLinks";
import { supabase } from "./supabaseClient";

export const DEFAULT_CONTACT_SUBTITLE =
  "Have a question or want to work together? I'd love to hear from you.";

export const DEFAULT_CONTACT_LOCATION = "Colorado, USA";

export interface ContactPageData {
  pageSubtitle: string;
  email: string;
  location: string;
  linkedinUrl: string;
  resumeUrl: string | null;
}

export const DEFAULT_CONTACT_PAGE: ContactPageData = {
  pageSubtitle: DEFAULT_CONTACT_SUBTITLE,
  email: getPublicContactEmail(),
  location: DEFAULT_CONTACT_LOCATION,
  linkedinUrl: LINKEDIN_PROFILE_URL,
  resumeUrl: null,
};

const CONTACT_STORAGE_KEY = "contactPageContent";

export function normalizeLinkedInUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Short label for the contact card, e.g. linkedin.com/in/bureson */
export function formatLinkedInDisplay(url: string): string {
  const normalized = normalizeLinkedInUrl(url);
  if (!normalized) return "LinkedIn";
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./i, "");
    const path = parsed.pathname.replace(/\/$/, "");
    return `${host}${path}` || host;
  } catch {
    return normalized.replace(/^https?:\/\//i, "");
  }
}

function readLocalContactDraft(): Partial<ContactPageData> | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(CONTACT_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as {
      pageSubtitle?: string;
      contactInfo?: { email?: string; location?: string; linkedinUrl?: string };
      linkedinUrl?: string;
    };
    return {
      pageSubtitle: parsed.pageSubtitle,
      email: parsed.contactInfo?.email,
      location: parsed.contactInfo?.location,
      linkedinUrl: parsed.contactInfo?.linkedinUrl ?? parsed.linkedinUrl,
    };
  } catch {
    return null;
  }
}

export function writeLocalContactDraft(data: ContactPageData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CONTACT_STORAGE_KEY,
    JSON.stringify({
      pageSubtitle: data.pageSubtitle,
      contactInfo: {
        email: data.email,
        location: data.location,
        linkedinUrl: data.linkedinUrl,
      },
      linkedinUrl: data.linkedinUrl,
      lastModified: new Date().toISOString(),
    }),
  );
}

export async function fetchContactPageData(): Promise<ContactPageData> {
  const local = readLocalContactDraft();

  let next: ContactPageData = {
    ...DEFAULT_CONTACT_PAGE,
    pageSubtitle: local?.pageSubtitle?.trim() || DEFAULT_CONTACT_PAGE.pageSubtitle,
    location: local?.location?.trim() || DEFAULT_CONTACT_PAGE.location,
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);
    const profile = await fetchOwnerContactProfile(ownerId);

    if (profile?.email?.trim()) {
      next.email = profile.email.trim();
    } else if (local?.email?.trim()) {
      next.email = local.email.trim();
    }

    const profileLinkedIn =
      typeof profile?.linkedin_url === "string" ? profile.linkedin_url.trim() : "";
    if (profileLinkedIn) {
      next.linkedinUrl = normalizeLinkedInUrl(profileLinkedIn);
    } else if (local?.linkedinUrl?.trim()) {
      next.linkedinUrl = normalizeLinkedInUrl(local.linkedinUrl);
    }

    const resumeUrl = await fetchPublishedResumeUrl();
    if (resumeUrl) next.resumeUrl = resumeUrl;
  } catch {
    if (local?.email?.trim()) next.email = local.email.trim();
    if (local?.linkedinUrl?.trim()) next.linkedinUrl = normalizeLinkedInUrl(local.linkedinUrl);
    try {
      const resumeUrl = await fetchPublishedResumeUrl();
      if (resumeUrl) next.resumeUrl = resumeUrl;
    } catch {
      /* keep null */
    }
  }

  return next;
}

export function isLinkedInColumnMissingError(err: unknown): boolean {
  const msg = String(err);
  return /PGRST204/i.test(msg) && /linkedin_url/i.test(msg);
}

type OwnerContactProfileRow = {
  email?: string | null;
  linkedin_url?: string | null;
  resume_url?: string | null;
};

async function fetchOwnerContactProfile(ownerId: string): Promise<OwnerContactProfileRow | null> {
  const withLinkedIn = await supabase
    .from("profiles")
    .select("email, linkedin_url, resume_url")
    .eq("id", ownerId)
    .maybeSingle();

  if (!withLinkedIn.error) {
    return (withLinkedIn.data as OwnerContactProfileRow | null) ?? null;
  }

  if (isLinkedInColumnMissingError(withLinkedIn.error)) {
    const fallback = await supabase
      .from("profiles")
      .select("email, resume_url")
      .eq("id", ownerId)
      .maybeSingle();
    if (fallback.error) return null;
    return (fallback.data as OwnerContactProfileRow | null) ?? null;
  }

  return null;
}
