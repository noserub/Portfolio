import { useEffect, useState } from "react";
import {
  DEFAULT_ABOUT_HEADLINE,
  DEFAULT_ABOUT_LEAD,
  fetchAboutProfileRow,
  mergeDevAboutLocalStorageDraft,
  resolveAboutDisplayFields,
  type AboutProfileRow,
} from "../lib/aboutPageProfile";

export { DEFAULT_ABOUT_HEADLINE, DEFAULT_ABOUT_LEAD };

/** @deprecated Use DEFAULT_ABOUT_LEAD */
export const DEFAULT_ABOUT_SUBHEAD = DEFAULT_ABOUT_LEAD;

export interface AboutHighlight {
  title: string;
  text: string;
}

export interface AboutExpertiseItem {
  title: string;
  text: string;
}

export interface AboutHowIUseAiItem {
  title: string;
  text: string;
}

export interface AboutToolsCategory {
  title: string;
  tools: string[];
}

export interface AboutPageData {
  headline: string;
  heroLead: string;
  bioParagraph1: string;
  bioParagraph2: string;
  superPowersTitle: string;
  superPowers: string[];
  highlightsTitle: string;
  highlights: AboutHighlight[];
  expertiseTitle: string;
  expertiseItems: AboutExpertiseItem[];
  howIUseAITitle: string;
  howIUseAIItems: AboutHowIUseAiItem[];
  toolsTitle: string;
  toolsCategories: AboutToolsCategory[];
  sectionOrder: string[];
  resumeUrl: string | null;
}

/** Default section headings used when the CMS leaves a title blank. */
export const DEFAULT_ABOUT_SECTION_TITLES = {
  superPowers: "Leadership strengths",
  highlights: "Highlights",
  expertise: "Expertise",
  howIUseAI: "How I use AI",
  tools: "Tools & stack",
} as const;

function resolveTitle(raw: unknown, fallback: string): string {
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

const defaults: AboutPageData = {
  headline: DEFAULT_ABOUT_HEADLINE,
  heroLead: DEFAULT_ABOUT_LEAD,
  bioParagraph1: "",
  bioParagraph2: "",
  superPowersTitle: DEFAULT_ABOUT_SECTION_TITLES.superPowers,
  superPowers: [],
  highlightsTitle: DEFAULT_ABOUT_SECTION_TITLES.highlights,
  highlights: [],
  expertiseTitle: DEFAULT_ABOUT_SECTION_TITLES.expertise,
  expertiseItems: [],
  howIUseAITitle: DEFAULT_ABOUT_SECTION_TITLES.howIUseAI,
  howIUseAIItems: [],
  toolsTitle: DEFAULT_ABOUT_SECTION_TITLES.tools,
  toolsCategories: [],
  sectionOrder: [
    "superPowers",
    "highlights",
    "expertise",
    "howIUseAI",
    "tools",
  ],
  resumeUrl: null,
};

function normalizeToolsCategories(raw: unknown): AboutToolsCategory[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const titleRaw =
        (typeof row.title === "string" ? row.title : null) ??
        (typeof row.category === "string" ? row.category : null);
      const title = titleRaw?.trim() ?? "";
      const tools = Array.isArray(row.tools)
        ? row.tools.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        : [];
      if (!title || tools.length === 0) return null;
      return { title, tools };
    })
    .filter((cat): cat is AboutToolsCategory => cat !== null);
}

function mapProfileToAboutPageData(profile: AboutProfileRow): AboutPageData {
  const resolved = resolveAboutDisplayFields(profile);
  const toolsCategories = normalizeToolsCategories(profile.tools_categories);
  return {
    headline: resolved.headline,
    heroLead: resolved.heroLead,
    bioParagraph1: resolved.bioParagraph1,
    bioParagraph2: resolved.bioParagraph2,
    superPowersTitle: resolveTitle(profile.super_powers_title, DEFAULT_ABOUT_SECTION_TITLES.superPowers),
    superPowers: Array.isArray(profile.super_powers) ? profile.super_powers : [],
    highlightsTitle: resolveTitle(profile.highlights_title, DEFAULT_ABOUT_SECTION_TITLES.highlights),
    highlights: Array.isArray(profile.highlights) ? profile.highlights : [],
    expertiseTitle: resolveTitle(profile.expertise_title, DEFAULT_ABOUT_SECTION_TITLES.expertise),
    expertiseItems: Array.isArray(profile.expertise_items) ? profile.expertise_items : [],
    howIUseAITitle: resolveTitle(profile.how_i_use_ai_title, DEFAULT_ABOUT_SECTION_TITLES.howIUseAI),
    howIUseAIItems: Array.isArray(profile.how_i_use_ai_items)
      ? profile.how_i_use_ai_items
      : [],
    toolsTitle: resolveTitle(profile.tools_title, DEFAULT_ABOUT_SECTION_TITLES.tools),
    toolsCategories,
    sectionOrder:
      Array.isArray(profile.section_order) && profile.section_order.length > 0
        ? profile.section_order
        : defaults.sectionOrder,
    resumeUrl: (profile.resume_url as string) || null,
  };
}

export function useAboutPageData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AboutPageData>(defaults);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const remote = await fetchAboutProfileRow();
        const profile = mergeDevAboutLocalStorageDraft(remote);

        if (cancelled) return;

        if (profile) {
          setData(mapProfileToAboutPageData(profile));
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, data };
}
