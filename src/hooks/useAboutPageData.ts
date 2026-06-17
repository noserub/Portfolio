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
  superPowers: string[];
  highlights: AboutHighlight[];
  expertiseItems: AboutExpertiseItem[];
  howIUseAIItems: AboutHowIUseAiItem[];
  toolsCategories: AboutToolsCategory[];
  sectionOrder: string[];
  resumeUrl: string | null;
}

const defaults: AboutPageData = {
  headline: DEFAULT_ABOUT_HEADLINE,
  heroLead: DEFAULT_ABOUT_LEAD,
  bioParagraph1: "",
  bioParagraph2: "",
  superPowers: [],
  highlights: [],
  expertiseItems: [],
  howIUseAIItems: [],
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
    superPowers: Array.isArray(profile.super_powers) ? profile.super_powers : [],
    highlights: Array.isArray(profile.highlights) ? profile.highlights : [],
    expertiseItems: Array.isArray(profile.expertise_items) ? profile.expertise_items : [],
    howIUseAIItems: Array.isArray(profile.how_i_use_ai_items)
      ? profile.how_i_use_ai_items
      : [],
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
