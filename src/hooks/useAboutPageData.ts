import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ABOUT_HEADLINE,
  DEFAULT_ABOUT_LEAD,
  fetchAboutProfileRow,
  mergeDevAboutLocalStorageDraft,
  resolveAboutDisplayFields,
  type AboutProfileRow,
} from "../lib/aboutPageProfile";
import {
  mapProfileToAboutEditorDraft,
  DEFAULT_ABOUT_SECTION_ORDER,
  DEFAULT_ABOUT_SECTION_TITLES,
} from "../lib/aboutPageEditorModel";

export { DEFAULT_ABOUT_HEADLINE, DEFAULT_ABOUT_LEAD };

/** @deprecated Use DEFAULT_ABOUT_LEAD */
export const DEFAULT_ABOUT_SUBHEAD = DEFAULT_ABOUT_LEAD;

export { DEFAULT_ABOUT_SECTION_TITLES };

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
  leadershipTitle: string;
  leadershipItems: AboutHighlight[];
  expertiseTitle: string;
  expertiseItems: AboutExpertiseItem[];
  howIUseAITitle: string;
  howIUseAIItems: AboutHowIUseAiItem[];
  processTitle: string;
  processSubheading: string;
  processItems: { num: string; title: string; items: string[] }[];
  certificationsTitle: string;
  certificationsItems: { badge: string; title: string; org: string }[];
  toolsTitle: string;
  toolsCategories: AboutToolsCategory[];
  sectionOrder: string[];
  resumeUrl: string | null;
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
  leadershipTitle: "Leadership & impact",
  leadershipItems: [],
  expertiseTitle: DEFAULT_ABOUT_SECTION_TITLES.expertise,
  expertiseItems: [],
  howIUseAITitle: DEFAULT_ABOUT_SECTION_TITLES.howIUseAI,
  howIUseAIItems: [],
  processTitle: DEFAULT_ABOUT_SECTION_TITLES.process,
  processSubheading: "",
  processItems: [],
  certificationsTitle: "Certifications",
  certificationsItems: [],
  toolsTitle: DEFAULT_ABOUT_SECTION_TITLES.tools,
  toolsCategories: [],
  sectionOrder: [...DEFAULT_ABOUT_SECTION_ORDER],
  resumeUrl: null,
};

function mapProfileToAboutPageData(profile: AboutProfileRow): AboutPageData {
  const resolved = resolveAboutDisplayFields(profile);
  const editor = mapProfileToAboutEditorDraft(profile);
  return {
    headline: resolved.headline,
    heroLead: resolved.heroLead,
    bioParagraph1: resolved.bioParagraph1,
    bioParagraph2: resolved.bioParagraph2,
    superPowersTitle: editor.superPowersTitle,
    superPowers: editor.superPowers,
    highlightsTitle: editor.highlightsTitle,
    highlights: editor.highlights,
    leadershipTitle: editor.leadershipTitle,
    leadershipItems: editor.leadershipItems,
    expertiseTitle: editor.expertiseTitle,
    expertiseItems: editor.expertiseItems,
    howIUseAITitle: editor.howIUseAITitle,
    howIUseAIItems: editor.howIUseAIItems,
    processTitle: editor.processTitle,
    processSubheading: editor.processSubheading,
    processItems: editor.processItems,
    certificationsTitle: editor.certificationsTitle,
    certificationsItems: editor.certificationsItems,
    toolsTitle: editor.toolsTitle,
    toolsCategories: editor.toolsCategories,
    sectionOrder: editor.sectionOrder,
    resumeUrl: editor.resumeUrl.trim() || null,
  };
}

export function useAboutPageData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AboutPageData>(defaults);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

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
  }, [reloadToken]);

  return { loading, data, reload };
}
