import { getPostgrestErrorMessage, supabase } from "./supabaseClient";
import { getProfileWriterUserId } from "./portfolioOwner";

export const DEFAULT_ABOUT_HEADLINE = "AI-first design leader who still ships.";

export const DEFAULT_ABOUT_LEAD =
  "I align executives, product, and engineering on strategy, then drive the work from research and design systems through prototypes and production-ready code.";

const ABOUT_PROFILE_SELECT_BASE =
  "bio_paragraph_1, bio_paragraph_2, super_powers_title, super_powers, highlights_title, highlights, leadership_title, leadership_items, expertise_title, expertise_items, how_i_use_ai_title, how_i_use_ai_items, process_title, process_subheading, process_items, certifications_title, certifications_items, tools_title, tools_categories, section_order, resume_url, updated_at";

const ABOUT_PROFILE_SELECT_WITH_HERO =
  `about_hero_headline, about_hero_lead, ${ABOUT_PROFILE_SELECT_BASE}`;

/** Set false when remote DB has not applied migration 0038 yet. */
let aboutHeroColumnsAvailable = true;

export function areAboutHeroColumnsAvailable(): boolean {
  return aboutHeroColumnsAvailable;
}

export function setAboutHeroColumnsAvailable(available: boolean): void {
  aboutHeroColumnsAvailable = available;
}

export type AboutProfileRow = {
  about_hero_headline?: string | null;
  about_hero_lead?: string | null;
  bio_paragraph_1?: string | null;
  bio_paragraph_2?: string | null;
  super_powers_title?: string | null;
  super_powers?: unknown;
  highlights_title?: string | null;
  highlights?: unknown;
  leadership_title?: string | null;
  leadership_items?: unknown;
  expertise_title?: string | null;
  expertise_items?: unknown;
  how_i_use_ai_title?: string | null;
  how_i_use_ai_items?: unknown;
  process_title?: string | null;
  process_subheading?: string | null;
  process_items?: unknown;
  certifications_title?: string | null;
  certifications_items?: unknown;
  tools_title?: string | null;
  tools_categories?: unknown;
  section_order?: unknown;
  resume_url?: string | null;
  updated_at?: string | null;
};

export type ResolvedAboutContent = {
  headline: string;
  heroLead: string;
  bioParagraph1: string;
  bioParagraph2: string;
};

function trim(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Map profile columns → modern About sections.
 * Section 1: headline + heroLead. Section 2 card: bioParagraph1 + bioParagraph2.
 *
 * Legacy: before about_hero_* columns, bio_paragraph_1 was often used as the hero lead.
 */
export function resolveAboutDisplayFields(profile: AboutProfileRow): ResolvedAboutContent {
  const heroHeadlineRaw = trim(profile.about_hero_headline);
  const heroLeadRaw = trim(profile.about_hero_lead);
  const bio1 = trim(profile.bio_paragraph_1);
  const bio2 = trim(profile.bio_paragraph_2);

  const hasDedicatedHero = Boolean(heroHeadlineRaw || heroLeadRaw);

  let heroLead = heroLeadRaw;
  let bioParagraph1 = bio1;

  if (!hasDedicatedHero && bio1) {
    heroLead = bio1;
    bioParagraph1 = "";
  } else if (!heroLead) {
    heroLead = DEFAULT_ABOUT_LEAD;
  }

  return {
    headline: heroHeadlineRaw || DEFAULT_ABOUT_HEADLINE,
    heroLead,
    bioParagraph1,
    bioParagraph2: bio2,
  };
}

export function getProfileUpdatedAtMs(profile: { updated_at?: string | null } | null): number {
  if (!profile?.updated_at) return 0;
  const t = Date.parse(profile.updated_at);
  return Number.isNaN(t) ? 0 : t;
}

/** `lastModified` on aboutPageProfile local draft (ISO string). Missing or invalid → treat as infinitely old. */
export function getLocalAboutDraftMs(profileData: Record<string, unknown>): number {
  const lm = profileData.lastModified;
  if (typeof lm !== "string" || !lm.trim()) return 0;
  const t = Date.parse(lm);
  return Number.isNaN(t) ? 0 : t;
}

export function isAboutHeroColumnMissingError(err: unknown): boolean {
  const msg = getPostgrestErrorMessage(err);
  return /PGRST204/i.test(msg) && /about_hero_(headline|lead)/i.test(msg);
}

/** Drop hero columns from a profile write when migration 0038 is not applied yet. */
export function omitAboutHeroFields<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, "about_hero_headline" | "about_hero_lead"> {
  const { about_hero_headline: _h, about_hero_lead: _l, ...rest } = payload;
  return rest;
}

async function fetchProfileBySelect(
  select: string,
  profileRowId: string,
): Promise<{ row: AboutProfileRow | null; error: unknown | null }> {
  const { data: ownerRow, error: ownerErr } = await supabase
    .from("profiles")
    .select(select)
    .eq("id", profileRowId)
    .maybeSingle();

  if (ownerRow) return { row: ownerRow as AboutProfileRow, error: null };

  if (ownerErr && !isAboutHeroColumnMissingError(ownerErr)) {
    console.warn("About profile load error:", ownerErr);
  }

  const { data: legacyRow, error: legacyErr } = await supabase
    .from("profiles")
    .select(select)
    .not("bio_paragraph_1", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (legacyErr) {
    return { row: null, error: legacyErr };
  }

  return { row: (legacyRow as AboutProfileRow | null) ?? null, error: ownerErr ?? legacyErr };
}

/** One lightweight check so CMS saves skip hero fields before the first failed write. */
export async function probeAboutHeroColumns(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profileRowId = getProfileWriterUserId(user?.id);
  const { error } = await supabase
    .from("profiles")
    .select("about_hero_headline")
    .eq("id", profileRowId)
    .maybeSingle();

  if (isAboutHeroColumnMissingError(error)) {
    aboutHeroColumnsAvailable = false;
    return false;
  }

  aboutHeroColumnsAvailable = true;
  return true;
}

/**
 * Load the same profiles row the About CMS uses (writer id when signed in, else published owner).
 * Falls back to the newest profile with bio content if the owner row is missing.
 */
export async function fetchAboutProfileRow(): Promise<AboutProfileRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profileRowId = getProfileWriterUserId(user?.id);

  const withHero = await fetchProfileBySelect(ABOUT_PROFILE_SELECT_WITH_HERO, profileRowId);
  if (!withHero.error) {
    aboutHeroColumnsAvailable = true;
    return withHero.row;
  }

  if (isAboutHeroColumnMissingError(withHero.error)) {
    aboutHeroColumnsAvailable = false;
    const base = await fetchProfileBySelect(ABOUT_PROFILE_SELECT_BASE, profileRowId);
    if (base.error) {
      console.warn("About profile legacy select error:", base.error);
    }
    return base.row;
  }

  console.warn("About profile load error:", withHero.error);
  return withHero.row;
}

/** Dev-only: overlay newer localStorage draft so modern preview matches CMS edits. */
export function mergeDevAboutLocalStorageDraft(
  profile: AboutProfileRow | null,
): AboutProfileRow | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return profile;

  const savedProfile = localStorage.getItem("aboutPageProfile");
  if (!savedProfile) return profile;

  try {
    const draft = JSON.parse(savedProfile) as Record<string, unknown>;
    const localMs = getLocalAboutDraftMs(draft);
    const remoteMs = getProfileUpdatedAtMs(profile);
    if (localMs <= remoteMs) return profile;

    return {
      ...(profile ?? {}),
      about_hero_headline:
        (typeof draft.about_hero_headline === "string"
          ? draft.about_hero_headline
          : profile?.about_hero_headline) ?? null,
      about_hero_lead:
        (typeof draft.about_hero_lead === "string"
          ? draft.about_hero_lead
          : profile?.about_hero_lead) ?? null,
      bio_paragraph_1:
        (typeof draft.bio_paragraph_1 === "string" ? draft.bio_paragraph_1 : profile?.bio_paragraph_1) ??
        null,
      bio_paragraph_2:
        (typeof draft.bio_paragraph_2 === "string" ? draft.bio_paragraph_2 : profile?.bio_paragraph_2) ??
        null,
      super_powers_title:
        (typeof draft.super_powers_title === "string" ? draft.super_powers_title : profile?.super_powers_title) ??
        null,
      super_powers: draft.super_powers ?? profile?.super_powers,
      highlights_title:
        (typeof draft.highlights_title === "string" ? draft.highlights_title : profile?.highlights_title) ??
        null,
      highlights: draft.highlights ?? profile?.highlights,
      expertise_title:
        (typeof draft.expertise_title === "string" ? draft.expertise_title : profile?.expertise_title) ??
        null,
      expertise_items: draft.expertise_items ?? profile?.expertise_items,
      how_i_use_ai_title:
        (typeof draft.how_i_use_ai_title === "string" ? draft.how_i_use_ai_title : profile?.how_i_use_ai_title) ??
        null,
      how_i_use_ai_items: draft.how_i_use_ai_items ?? profile?.how_i_use_ai_items,
      tools_title:
        (typeof draft.tools_title === "string" ? draft.tools_title : profile?.tools_title) ??
        null,
      tools_categories: draft.tools_categories ?? profile?.tools_categories,
      section_order: draft.section_order ?? profile?.section_order,
      resume_url:
        (typeof draft.resume_url === "string" ? draft.resume_url : profile?.resume_url) ?? null,
    };
  } catch {
    return profile;
  }
}
