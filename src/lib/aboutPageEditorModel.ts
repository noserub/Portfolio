import type { ProfileUpdate } from "../hooks/useProfiles";
import { MODERN_ABOUT_HIGHLIGHTS, MODERN_ABOUT_PROCESS } from "../design/modernAboutContent";
import {
  DEFAULT_ABOUT_HEADLINE,
  DEFAULT_ABOUT_LEAD,
  type AboutProfileRow,
} from "./aboutPageProfile";

function defaultAboutHighlights(): AboutTitleTextItem[] {
  return MODERN_ABOUT_HIGHLIGHTS.map((h) => ({ title: h.title, text: h.text }));
}

function defaultAboutProcessItems(): AboutProcessItem[] {
  return MODERN_ABOUT_PROCESS.steps.map((step) => ({
    num: `${step.num} · ${step.phase.toUpperCase()}`,
    title: step.title,
    items: [step.description],
  }));
}

function defaultAboutProcessSubheading(): string {
  return MODERN_ABOUT_PROCESS.subheading;
}

function processItemsFingerprint(items: AboutProcessItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      num: item.num,
      title: item.title,
      items: item.items,
    })),
  );
}

const LEGACY_ABOUT_PROCESS_ITEM_SETS: AboutProcessItem[][] = [
  [
    {
      num: "01 · DISCOVER",
      title: "Clarify the decision",
      items: [
        "Understand the real workflow, constraints, and what would count as success before design work spreads.",
      ],
    },
    {
      num: "02 · FRAME",
      title: "Set direction",
      items: [
        "Align executives, product, and engineering on one bet: permissions, failure modes, and patterns the team can actually build.",
      ],
    },
    {
      num: "03 · PROTOTYPE",
      title: "Learn before we commit",
      items: [
        "Research, prototypes in code, and eval checks when stakes are high. Reduce the cost of being wrong before engineering commits.",
      ],
    },
    {
      num: "04 · SHIP & LEARN",
      title: "Ship and measure",
      items: [
        "Stay close through implementation and launch readiness. Track adoption and failure modes after release, then fix what production proved.",
      ],
    },
  ],
  [
    {
      num: "01 · DISCOVER",
      title: "Align on the bet",
      items: [
        "Translate ambiguous goals into a clear problem, success metrics, and constraints (policy, risk, technical).",
      ],
    },
    {
      num: "02 · FRAME",
      title: "Set direction",
      items: [
        "Roadmap tradeoffs, trust UX, and patterns that align executives, product, and engineering.",
      ],
    },
    {
      num: "03 · PROTOTYPE",
      title: "Learn before we commit",
      items: [
        "Research, prototypes, eval harnesses, and code when speed matters. Lower the cost of being wrong early.",
      ],
    },
    {
      num: "04 · SHIP & LEARN",
      title: "Ship and improve",
      items: [
        "Partner through implementation, launch readiness, and post-ship measurement. Evidence over opinions.",
      ],
    },
  ],
  [
    {
      num: "01 · DISCOVER",
      title: "Map the mess",
      items: ["Journeys, constraints, risk, and the real problem under the ask."],
    },
    {
      num: "02 · FRAME",
      title: "Set the north star",
      items: ["Trust model, eval criteria, and a system teams can build against."],
    },
    {
      num: "03 · PROTOTYPE",
      title: "Make it testable early",
      items: ["Research, hi-fi sims, eval harnesses, and fast AI-assisted iteration."],
    },
    {
      num: "04 · SHIP & LEARN",
      title: "Land and measure",
      items: ["Launch readiness, governed rollout, adoption metrics, and org learning."],
    },
  ],
  [
    {
      num: "01 · DISCOVER",
      title: "Map the mess",
      items: ["Journeys, flows, and the real problem under the ask."],
    },
    {
      num: "02 · FRAME",
      title: "Set the vision",
      items: ["North star, trust model, and a system teams can build against."],
    },
    {
      num: "03 · PROTOTYPE",
      title: "Make it real",
      items: ["Research, high-fi sims, eval harnesses, and fast AI-assisted iteration."],
    },
    {
      num: "04 · SHIP",
      title: "Land the outcome",
      items: ["Design systems, launch readiness, and measurable adoption."],
    },
  ],
];

const LEGACY_ABOUT_PROCESS_SUBHEADINGS = new Set([
  "Systems thinking, from ambiguity to shippable product.",
  "My process adapts to each project, but it stays grounded in rapid learning, governed iteration, and shippable outcomes.",
  "My process adapts to each project, but it stays grounded in rapid learning, stakeholder alignment, and outcomes you can measure.",
]);

function isLegacyAboutProcessItems(items: AboutProcessItem[]): boolean {
  if (items.length === 0) return false;
  const fp = processItemsFingerprint(items);
  return LEGACY_ABOUT_PROCESS_ITEM_SETS.some((legacy) => processItemsFingerprint(legacy) === fp);
}

function resolveAboutProcessContent(
  profile: AboutProfileRow | null,
  mappedProcess: AboutProcessItem[],
): { processItems: AboutProcessItem[]; processSubheading: string } {
  const processSubheadingRaw =
    typeof profile?.process_subheading === "string" ? profile.process_subheading.trim() : "";

  if (profile?.process_items == null || mappedProcess.length === 0) {
    return {
      processItems: defaultAboutProcessItems(),
      processSubheading: processSubheadingRaw || defaultAboutProcessSubheading(),
    };
  }

  if (isLegacyAboutProcessItems(mappedProcess)) {
    return {
      processItems: defaultAboutProcessItems(),
      processSubheading:
        !processSubheadingRaw || LEGACY_ABOUT_PROCESS_SUBHEADINGS.has(processSubheadingRaw)
          ? defaultAboutProcessSubheading()
          : processSubheadingRaw,
    };
  }

  return {
    processItems: mappedProcess,
    processSubheading: processSubheadingRaw,
  };
}

/** Default section headings used when the CMS leaves a title blank. */
export const DEFAULT_ABOUT_SECTION_TITLES = {
  superPowers: "Leadership strengths",
  process: "How I work",
  highlights: "Highlights",
  expertise: "Expertise",
  howIUseAI: "How I use AI",
  tools: "Tools & stack",
} as const;

export interface AboutTitleTextItem {
  title: string;
  text: string;
}

export interface AboutProcessItem {
  num: string;
  title: string;
  items: string[];
}

export interface AboutCertificationItem {
  badge: string;
  title: string;
  org: string;
}

export interface AboutToolsCategoryDraft {
  title: string;
  tools: string[];
}

export interface AboutEditorDraft {
  headline: string;
  heroLead: string;
  bioParagraph1: string;
  bioParagraph2: string;
  resumeUrl: string;
  superPowersTitle: string;
  superPowers: string[];
  highlightsTitle: string;
  highlights: AboutTitleTextItem[];
  leadershipTitle: string;
  leadershipItems: AboutTitleTextItem[];
  expertiseTitle: string;
  expertiseItems: AboutTitleTextItem[];
  howIUseAITitle: string;
  howIUseAIItems: AboutTitleTextItem[];
  processTitle: string;
  processSubheading: string;
  processItems: AboutProcessItem[];
  certificationsTitle: string;
  certificationsItems: AboutCertificationItem[];
  toolsTitle: string;
  toolsCategories: AboutToolsCategoryDraft[];
  sectionOrder: string[];
}

export const DEFAULT_ABOUT_SECTION_ORDER = [
  "process",
  "highlights",
  "superPowers",
  "leadership",
  "expertise",
  "howIUseAI",
  "certifications",
  "tools",
] as const;

/** Shown when the profile has no saved tools list (classic About used hardcoded defaults). */
export const DEFAULT_ABOUT_TOOLS_CATEGORIES: AboutToolsCategoryDraft[] = [
  {
    title: "Design and prototyping",
    tools: [
      "Pencil and paper",
      "Whiteboards",
      "Figma",
      "Figma Make",
      "Adobe CC",
      "Lovable",
      "Subframe",
      "Cursor",
      "MidJourney",
      "Google AI Studio",
    ],
  },
  {
    title: "Research and analysis",
    tools: [
      "dScout",
      "UserZoom",
      "usertesting.com",
      "Optimal Workshop",
      "Gemini",
      "Perplexity",
      "ChatGPT",
      "Claude",
    ],
  },
];

const MODERN_ABOUT_SECTION_IDS = new Set<string>(DEFAULT_ABOUT_SECTION_ORDER);

export const ABOUT_SECTION_LABELS: Record<string, string> = {
  superPowers: "Leadership strengths",
  process: "How I work",
  highlights: "Highlights",
  leadership: "Leadership & impact",
  expertise: "Expertise",
  howIUseAI: "How I use AI",
  certifications: "Certifications",
  tools: "Tools & stack",
};

function resolveTitle(raw: unknown, fallback: string): string {
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

function mapTitleTextItems(raw: unknown): AboutTitleTextItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const text = typeof row.text === "string" ? row.text.trim() : "";
      if (!title && !text) return null;
      return { title, text };
    })
    .filter((x): x is AboutTitleTextItem => x !== null);
}

function mapProcessItems(raw: unknown): AboutProcessItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, i) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const num = typeof row.num === "string" ? row.num.trim() : String(i + 1);
      const items = Array.isArray(row.items)
        ? row.items.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        : [];
      if (!title) return null;
      return { num, title, items };
    })
    .filter((x): x is AboutProcessItem => x !== null);
}

function mapCertifications(raw: unknown): AboutCertificationItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        badge: typeof row.badge === "string" ? row.badge.trim() : "",
        title: typeof row.title === "string" ? row.title.trim() : "",
        org: typeof row.org === "string" ? row.org.trim() : "",
      };
    })
    .filter((x): x is AboutCertificationItem => x !== null && Boolean(x.title));
}

function mapToolsCategories(raw: unknown): AboutToolsCategoryDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const title =
        (typeof row.title === "string" ? row.title : null) ??
        (typeof row.category === "string" ? row.category : null) ??
        "";
      const tools = Array.isArray(row.tools)
        ? row.tools.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        : [];
      const resolvedTitle = title.trim() || (tools.length > 0 ? "Tools" : "");
      if (!resolvedTitle) return null;
      return { title: resolvedTitle, tools };
    })
    .filter((x): x is AboutToolsCategoryDraft => x !== null);
}

/** Sections in `section_order` are shown on the About page, in this order. */
export function normalizeAboutSectionOrder(rawOrder: string[]): string[] {
  const cleaned = rawOrder.filter((id) => MODERN_ABOUT_SECTION_IDS.has(id));
  return cleaned.length > 0 ? cleaned : [...DEFAULT_ABOUT_SECTION_ORDER];
}

/** Ensure process appears before highlights for existing saved section orders. */
export function migrateAboutSectionOrder(rawOrder: string[]): string[] {
  const order = normalizeAboutSectionOrder(rawOrder);
  const processIndex = order.indexOf("process");
  const highlightsIndex = order.indexOf("highlights");

  if (processIndex === -1) {
    if (highlightsIndex >= 0) {
      const next = [...order];
      next.splice(highlightsIndex, 0, "process");
      return next;
    }
    return ["process", ...order];
  }

  if (highlightsIndex >= 0 && processIndex > highlightsIndex) {
    const next = [...order];
    next.splice(processIndex, 1);
    next.splice(highlightsIndex, 0, "process");
    return next;
  }

  return order;
}

export function hiddenAboutSections(sectionOrder: string[]): string[] {
  return DEFAULT_ABOUT_SECTION_ORDER.filter((id) => !sectionOrder.includes(id));
}

export function mapProfileToAboutEditorDraft(profile: AboutProfileRow | null): AboutEditorDraft {
  const headline =
    typeof profile?.about_hero_headline === "string" && profile.about_hero_headline.trim()
      ? profile.about_hero_headline.trim()
      : DEFAULT_ABOUT_HEADLINE;
  const heroLead =
    typeof profile?.about_hero_lead === "string" && profile.about_hero_lead.trim()
      ? profile.about_hero_lead.trim()
      : DEFAULT_ABOUT_LEAD;

  const sectionOrderRaw =
    Array.isArray(profile?.section_order) && profile.section_order.length > 0
      ? profile.section_order.filter((id): id is string => typeof id === "string")
      : [...DEFAULT_ABOUT_SECTION_ORDER];

  const mappedTools = mapToolsCategories(profile?.tools_categories);
  const toolsCategories =
    profile?.tools_categories == null
      ? DEFAULT_ABOUT_TOOLS_CATEGORIES.map((c) => ({ ...c, tools: [...c.tools] }))
      : mappedTools;

  const mappedHighlights = mapTitleTextItems(profile?.highlights);
  const highlights =
    profile?.highlights == null
      ? defaultAboutHighlights()
      : mappedHighlights;

  const mappedProcess = mapProcessItems(profile?.process_items);
  const { processItems, processSubheading } = resolveAboutProcessContent(profile, mappedProcess);

  const draftContent = {
    superPowers: Array.isArray(profile?.super_powers)
      ? profile.super_powers.filter((x): x is string => typeof x === "string")
      : [],
    highlights,
    leadershipItems: mapTitleTextItems(profile?.leadership_items),
    expertiseItems: mapTitleTextItems(profile?.expertise_items),
    howIUseAIItems: mapTitleTextItems(profile?.how_i_use_ai_items),
    processItems,
    certificationsItems: mapCertifications(profile?.certifications_items),
    toolsCategories,
  };

  const sectionOrder = migrateAboutSectionOrder(sectionOrderRaw);

  return {
    headline,
    heroLead,
    bioParagraph1: typeof profile?.bio_paragraph_1 === "string" ? profile.bio_paragraph_1 : "",
    bioParagraph2: typeof profile?.bio_paragraph_2 === "string" ? profile.bio_paragraph_2 : "",
    resumeUrl: typeof profile?.resume_url === "string" ? profile.resume_url : "",
    superPowersTitle: resolveTitle(profile?.super_powers_title, DEFAULT_ABOUT_SECTION_TITLES.superPowers),
    superPowers: draftContent.superPowers,
    highlightsTitle: resolveTitle(profile?.highlights_title, DEFAULT_ABOUT_SECTION_TITLES.highlights),
    highlights: draftContent.highlights,
    leadershipTitle: resolveTitle(profile?.leadership_title, "Leadership & impact"),
    leadershipItems: draftContent.leadershipItems,
    expertiseTitle: resolveTitle(profile?.expertise_title, DEFAULT_ABOUT_SECTION_TITLES.expertise),
    expertiseItems: draftContent.expertiseItems,
    howIUseAITitle: resolveTitle(profile?.how_i_use_ai_title, DEFAULT_ABOUT_SECTION_TITLES.howIUseAI),
    howIUseAIItems: draftContent.howIUseAIItems,
    processTitle: resolveTitle(profile?.process_title, DEFAULT_ABOUT_SECTION_TITLES.process),
    processSubheading,
    processItems: draftContent.processItems,
    certificationsTitle: resolveTitle(profile?.certifications_title, "Certifications"),
    certificationsItems: draftContent.certificationsItems,
    toolsTitle: resolveTitle(profile?.tools_title, DEFAULT_ABOUT_SECTION_TITLES.tools),
    toolsCategories: draftContent.toolsCategories,
    sectionOrder,
  };
}

export function aboutEditorDraftToProfileUpdate(draft: AboutEditorDraft): ProfileUpdate {
  return {
    about_hero_headline: draft.headline.trim() || null,
    about_hero_lead: draft.heroLead.trim() || null,
    bio_paragraph_1: draft.bioParagraph1,
    bio_paragraph_2: draft.bioParagraph2,
    resume_url: draft.resumeUrl.trim() || null,
    super_powers_title: draft.superPowersTitle,
    super_powers: draft.superPowers.filter((s) => s.trim()),
    highlights_title: draft.highlightsTitle,
    highlights: draft.highlights,
    leadership_title: draft.leadershipTitle,
    leadership_items: draft.leadershipItems,
    expertise_title: draft.expertiseTitle,
    expertise_items: draft.expertiseItems,
    how_i_use_ai_title: draft.howIUseAITitle,
    how_i_use_ai_items: draft.howIUseAIItems,
    process_title: draft.processTitle,
    process_subheading: draft.processSubheading,
    process_items: draft.processItems,
    certifications_title: draft.certificationsTitle,
    certifications_items: draft.certificationsItems,
    tools_title: draft.toolsTitle,
    tools_categories: draft.toolsCategories.map((c) => ({
      title: c.title,
      category: c.title,
      tools: c.tools,
    })),
    section_order: draft.sectionOrder,
  };
}
