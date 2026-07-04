import { getPortfolioOwnerUserId } from "./portfolioOwner";
import { fetchPublishedResumeUrl } from "./aboutPageProfile";
import { getPublicContactEmail } from "./publicContactEmail";
import { LINKEDIN_PROFILE_URL } from "./portfolioLinks";
import { getPostgrestErrorMessage, supabase } from "./supabaseClient";
import { tryWriteLocalStorage } from "./localStorageQuota";

export const CONTACT_PAGE_HEADLINE = "Start a product conversation.";

export const DEFAULT_CONTACT_SUBTITLE =
  "Working on an AI product, a 0→1 concept, or a complex workflow? Tell me what you're building and what kind of collaboration you're exploring.";

export const DEFAULT_CONTACT_LOCATION = "Denver, Colorado";

export const DEFAULT_CONTACT_MESSAGE_PLACEHOLDER =
  "What are you building, what stage are you at, and where do you need help?";

export const DEFAULT_CONTACT_SUBMIT_LABEL = "Send partnership inquiry";

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
const CONTACT_PAGE_CACHE_KEY = "contactPageData";
const CONTACT_PAGE_CACHE_VERSION = 2;

/** Set false when remote DB has not applied migration 0044 yet. */
let contactPageFieldsAvailable = true;

export function areContactPageFieldsAvailable(): boolean {
  return contactPageFieldsAvailable;
}

export function setContactPageFieldsAvailable(available: boolean): void {
  contactPageFieldsAvailable = available;
}

export function readContactPageCache(): ContactPageData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CONTACT_PAGE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContactPageData> & { v?: number };
    if (parsed.v !== CONTACT_PAGE_CACHE_VERSION) return null;
    if (!parsed || typeof parsed.email !== "string") return null;
    return {
      ...DEFAULT_CONTACT_PAGE,
      ...parsed,
      resumeUrl:
        typeof parsed.resumeUrl === "string" && parsed.resumeUrl.trim()
          ? parsed.resumeUrl.trim()
          : null,
    };
  } catch {
    return null;
  }
}

function writeContactPageCache(data: ContactPageData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CONTACT_PAGE_CACHE_KEY,
      JSON.stringify({ v: CONTACT_PAGE_CACHE_VERSION, ...data }),
    );
  } catch {
    /* ignore */
  }
}

/** Sync best-effort snapshot for hero copy only — never used to render contact tiles before hydrate. */
export function resolveInitialContactPageData(): ContactPageData {
  const local = readLocalContactDraft();
  return {
    ...DEFAULT_CONTACT_PAGE,
    pageSubtitle: local?.pageSubtitle?.trim() || DEFAULT_CONTACT_PAGE.pageSubtitle,
    location: local?.location?.trim() || DEFAULT_CONTACT_PAGE.location,
    email: local?.email?.trim() || DEFAULT_CONTACT_PAGE.email,
    linkedinUrl: local?.linkedinUrl?.trim()
      ? normalizeLinkedInUrl(local.linkedinUrl)
      : DEFAULT_CONTACT_PAGE.linkedinUrl,
  };
}

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
  tryWriteLocalStorage(
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

    const profileSubtitle =
      typeof profile?.contact_page_subtitle === "string" ? profile.contact_page_subtitle.trim() : "";
    if (profileSubtitle) {
      next.pageSubtitle = profileSubtitle;
    } else if (local?.pageSubtitle?.trim()) {
      next.pageSubtitle = local.pageSubtitle.trim();
    }

    const profileLocation =
      typeof profile?.contact_location === "string" ? profile.contact_location.trim() : "";
    if (profileLocation) {
      next.location = profileLocation;
    } else if (local?.location?.trim()) {
      next.location = local.location.trim();
    }

    const profileLinkedIn =
      typeof profile?.linkedin_url === "string" ? profile.linkedin_url.trim() : "";
    if (profileLinkedIn) {
      next.linkedinUrl = normalizeLinkedInUrl(profileLinkedIn);
    } else if (local?.linkedinUrl?.trim()) {
      next.linkedinUrl = normalizeLinkedInUrl(local.linkedinUrl);
    }

    const profileResume =
      typeof profile?.resume_url === "string" ? profile.resume_url.trim() : "";
    next.resumeUrl = profileResume || (await fetchPublishedResumeUrl()) || null;
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

  writeContactPageCache(next);
  return next;
}

export function isLinkedInColumnMissingError(err: unknown): boolean {
  const msg = getPostgrestErrorMessage(err);
  return /PGRST204/i.test(msg) && /linkedin_url/i.test(msg);
}

export function isContactPageFieldsMissingError(err: unknown): boolean {
  const msg = getPostgrestErrorMessage(err);
  return (
    /PGRST204/i.test(msg) &&
    (/contact_page_subtitle/i.test(msg) || /contact_location/i.test(msg))
  );
}

export function omitContactPageFields<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, "contact_page_subtitle" | "contact_location"> {
  const { contact_page_subtitle: _subtitle, contact_location: _location, ...rest } = payload;
  return rest;
}

export type ContactProfileUpdate = {
  email?: string;
  linkedin_url?: string;
  contact_page_subtitle?: string;
  contact_location?: string;
};

/** Persist contact page fields to the owner profile with migration-safe fallbacks. */
export async function persistContactPageProfileUpdate(
  data: ContactPageData,
  updateProfile: (updates: ContactProfileUpdate) => Promise<unknown>,
): Promise<{ savedToCloud: boolean; warning?: string }> {
  const normalized: ContactPageData = {
    ...data,
    email: data.email.trim(),
    linkedinUrl: normalizeLinkedInUrl(data.linkedinUrl),
  };

  writeLocalContactDraft(normalized);

  let payload: ContactProfileUpdate = {};
  if (normalized.email) payload.email = normalized.email;
  if (normalized.linkedinUrl) payload.linkedin_url = normalized.linkedinUrl;
  if (areContactPageFieldsAvailable()) {
    payload.contact_page_subtitle = normalized.pageSubtitle.trim();
    payload.contact_location = normalized.location.trim();
  }

  const save = async (body: ContactProfileUpdate) => {
    if (Object.keys(body).length === 0) return;
    await updateProfile(body);
  };

  try {
    await save(payload);
    return { savedToCloud: true };
  } catch (err) {
    if (isContactPageFieldsMissingError(err)) {
      setContactPageFieldsAvailable(false);
      const reduced = omitContactPageFields(payload) as ContactProfileUpdate;
      await save(reduced);
      return {
        savedToCloud: true,
        warning:
          "Email and LinkedIn saved. Run migration 0044 to publish contact subtitle and location for all visitors.",
      };
    }

    if (isLinkedInColumnMissingError(err)) {
      const { linkedin_url: _linkedin, ...withoutLinkedIn } = payload;
      try {
        await save(withoutLinkedIn);
        return {
          savedToCloud: true,
          warning:
            "Contact copy saved. Run migration 0042 to persist LinkedIn URL for all visitors.",
        };
      } catch (retryErr) {
        if (isContactPageFieldsMissingError(retryErr)) {
          setContactPageFieldsAvailable(false);
          const core = omitContactPageFields(withoutLinkedIn) as ContactProfileUpdate;
          await save(core);
          return {
            savedToCloud: true,
            warning: "Partial save. Run latest database migrations for full contact page sync.",
          };
        }
        throw retryErr;
      }
    }

    throw err;
  }
}

type OwnerContactProfileRow = {
  email?: string | null;
  linkedin_url?: string | null;
  resume_url?: string | null;
  contact_page_subtitle?: string | null;
  contact_location?: string | null;
};

const OWNER_CONTACT_PROFILE_SELECT =
  "email, linkedin_url, resume_url, contact_page_subtitle, contact_location";

async function fetchOwnerContactProfile(ownerId: string): Promise<OwnerContactProfileRow | null> {
  const full = await supabase
    .from("profiles")
    .select(OWNER_CONTACT_PROFILE_SELECT)
    .eq("id", ownerId)
    .maybeSingle();

  if (!full.error) {
    setContactPageFieldsAvailable(true);
    return (full.data as OwnerContactProfileRow | null) ?? null;
  }

  if (isContactPageFieldsMissingError(full.error)) {
    setContactPageFieldsAvailable(false);
  }

  if (isLinkedInColumnMissingError(full.error) || isContactPageFieldsMissingError(full.error)) {
    const fallbackSelect = isLinkedInColumnMissingError(full.error)
      ? "email, resume_url"
      : "email, linkedin_url, resume_url";
    const fallback = await supabase
      .from("profiles")
      .select(fallbackSelect)
      .eq("id", ownerId)
      .maybeSingle();
    if (fallback.error) return null;
    return (fallback.data as OwnerContactProfileRow | null) ?? null;
  }

  return null;
}
