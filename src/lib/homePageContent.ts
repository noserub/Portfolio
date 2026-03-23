/**
 * Home page CMS payload stored in `profiles.hero_text` and localStorage key `heroText`.
 * v2 wraps hero + stats + UI labels; legacy flat objects are migrated on read.
 */

export const HOME_PAGE_CONTENT_VERSION = 2 as const;

export type BioRunType = "text" | "bold" | "gradient";

export interface BioRun {
  type: BioRunType;
  text: string;
}

export interface BioParagraph {
  runs: BioRun[];
}

export interface BioDocument {
  paragraphs: BioParagraph[];
}

export interface HeroTextState {
  greeting: string;
  greetings?: string[];
  greetingFont?: string;
  lastGreetingPauseDuration?: number;
  subtitle: string;
  description: string;
  word1: string;
  word2: string;
  word3: string;
  word4: string;
  buttonText: string;
  /** Primary bio: paragraphs with mixed plain / bold / gradient segments. */
  bioDocument?: BioDocument;
  /** @deprecated Migrated into bioDocument on load */
  bioText?: string;
  /** @deprecated Migrated into bioDocument on load */
  accentText?: string;
  accentGradient?: boolean;
  bioParagraphGapRem?: number;
  bioLineHeight?: number;
  /** @deprecated Spacing now controlled by paragraph breaks in bioDocument */
  accentMarginTopRem?: number;
}

export interface HomePageStat {
  number: string;
  label: string;
  description: string;
}

export interface HomePageUI {
  caseStudiesTitle: string;
  filterAll: string;
  filterProductDesign: string;
  filterDevelopment: string;
  filterBranding: string;
}

export interface HomePageContentV2 {
  _version: typeof HOME_PAGE_CONTENT_VERSION;
  hero: HeroTextState;
  stats: HomePageStat[];
  ui: HomePageUI;
}

export type HomePagePersisted = HomePageContentV2;

export const DEFAULT_STATS: HomePageStat[] = [
  { number: "1", label: "Full stack web app", description: "Solo developer" },
  { number: "4", label: "AI native apps designed", description: "with RAG & MCP hooks" },
  { number: "6", label: "0-1 product launches", description: "From ambiguity to product" },
  { number: "9", label: "US patents", description: "Innovation and IP contribution" },
];

export const DEFAULT_UI: HomePageUI = {
  caseStudiesTitle: "Case studies",
  filterAll: "All",
  filterProductDesign: "Product design",
  filterDevelopment: "Development",
  filterBranding: "Branding",
};

export function defaultHeroTextState(): HeroTextState {
  const hero: HeroTextState = {
    greeting: "I build things.",
    greetings: [
      "I build things.",
      "Design > Code.",
      "Figma > Cursor.",
      "? > Insights.",
      "AI Product Builder.",
    ],
    greetingFont: "Inter, sans-serif",
    lastGreetingPauseDuration: 30000,
    subtitle: "Brian Bureson is a (super rad) product design leader and builder,",
    description: "crafting high quality products and teams through",
    word1: "planning",
    word2: "collaboration",
    word3: "empathy",
    word4: "design",
    buttonText: "About Brian",
    accentGradient: true,
    bioParagraphGapRem: 1,
    bioLineHeight: 1.625,
    accentMarginTopRem: 1,
  };
  return {
    ...hero,
    bioDocument: classicBioDocumentFromHero(hero),
  };
}

export function createDefaultHomePageContent(): HomePageContentV2 {
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: defaultHeroTextState(),
    stats: DEFAULT_STATS.map((s) => ({ ...s })),
    ui: { ...DEFAULT_UI },
  };
}

function mergeHero(partial: Partial<HeroTextState> | Record<string, unknown>): HeroTextState {
  const base = defaultHeroTextState();
  const h = partial as HeroTextState;
  const merged: HeroTextState = {
    ...base,
    ...h,
    greetings: h.greetings?.length
      ? h.greetings
      : h.greeting
        ? [h.greeting]
        : base.greetings,
    greeting: h.greeting || (h.greetings && h.greetings[0]) || base.greeting,
    accentGradient: h.accentGradient !== false,
    bioParagraphGapRem:
      typeof h.bioParagraphGapRem === "number" && !Number.isNaN(h.bioParagraphGapRem)
        ? h.bioParagraphGapRem
        : base.bioParagraphGapRem,
    bioLineHeight:
      typeof h.bioLineHeight === "number" && !Number.isNaN(h.bioLineHeight)
        ? h.bioLineHeight
        : base.bioLineHeight,
    accentMarginTopRem:
      typeof h.accentMarginTopRem === "number" && !Number.isNaN(h.accentMarginTopRem)
        ? h.accentMarginTopRem
        : base.accentMarginTopRem,
  };

  const payloadHasBioDocument =
    Object.prototype.hasOwnProperty.call(partial, "bioDocument") &&
    h.bioDocument != null &&
    Array.isArray(h.bioDocument.paragraphs) &&
    h.bioDocument.paragraphs.length > 0;

  if (!payloadHasBioDocument) {
    merged.bioDocument = undefined;
  }

  merged.bioDocument = legacyToBioDocument(merged);
  return merged;
}

function mergeStats(raw: unknown): HomePageStat[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_STATS.map((s) => ({ ...s }));
  }
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      number: String(o.number ?? ""),
      label: String(o.label ?? ""),
      description: String(o.description ?? ""),
    };
  });
}

function mergeUI(raw: unknown): HomePageUI {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<HomePageUI>;
  return {
    ...DEFAULT_UI,
    ...o,
  };
}

/** Normalize Supabase / localStorage JSON into v2 content. */
export function parseStoredHomeContent(raw: unknown): HomePageContentV2 {
  if (!raw || typeof raw !== "object") {
    return createDefaultHomePageContent();
  }

  const obj = raw as Record<string, unknown>;

  if (obj._version === HOME_PAGE_CONTENT_VERSION && obj.hero && typeof obj.hero === "object") {
    return {
      _version: HOME_PAGE_CONTENT_VERSION,
      hero: mergeHero(obj.hero as Record<string, unknown>),
      stats: mergeStats(obj.stats),
      ui: mergeUI(obj.ui),
    };
  }

  // Legacy: entire blob was hero fields only
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: mergeHero(obj),
    stats: DEFAULT_STATS.map((s) => ({ ...s })),
    ui: { ...DEFAULT_UI },
  };
}

export function toPersistedPayload(content: HomePageContentV2): HomePagePersisted {
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: { ...content.hero },
    stats: content.stats.map((s) => ({ ...s })),
    ui: { ...content.ui },
  };
}

export function heroHasMinimumContent(hero: HeroTextState): boolean {
  return (hero.greetings?.length ?? 0) > 0 || Boolean(hero.greeting?.trim());
}

export function splitBioParagraphs(bioText: string | undefined): string[] {
  if (!bioText?.trim()) return [];
  return bioText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function sanitizeBioDocument(raw: BioDocument): BioDocument {
  const paragraphs = (raw.paragraphs || [])
    .map((p) => ({
      runs: (p.runs || [])
        .filter(
          (r) =>
            r &&
            typeof r === "object" &&
            ["text", "bold", "gradient"].includes(String((r as BioRun).type)),
        )
        .map((r) => {
          const run = r as BioRun;
          return {
            type: run.type as BioRunType,
            text: typeof run.text === "string" ? run.text : "",
          };
        }),
    }))
    .filter((p) => p.runs.length > 0);
  return { paragraphs };
}

/** One paragraph matching the original “classic” home bio (bold lead + gradient words). */
export function classicBioDocumentFromHero(
  hero: Pick<HeroTextState, "subtitle" | "description" | "word1" | "word2" | "word3" | "word4">,
): BioDocument {
  return {
    paragraphs: [
      {
        runs: [
          { type: "bold", text: hero.subtitle },
          { type: "text", text: ` ${hero.description} ` },
          { type: "gradient", text: hero.word1 },
          { type: "text", text: ", " },
          { type: "gradient", text: hero.word2 },
          { type: "text", text: ", " },
          { type: "gradient", text: hero.word3 },
          { type: "text", text: ", and " },
          { type: "gradient", text: hero.word4 },
          { type: "text", text: "." },
        ],
      },
    ],
  };
}

export function legacyToBioDocument(hero: HeroTextState): BioDocument {
  const raw = hero.bioDocument;
  if (raw && Array.isArray(raw.paragraphs) && raw.paragraphs.length > 0) {
    const sanitized = sanitizeBioDocument(raw);
    if (sanitized.paragraphs.length > 0) {
      return sanitized;
    }
  }

  const fromBioText = splitBioParagraphs(hero.bioText);
  if (fromBioText.length > 0) {
    const paragraphs: BioParagraph[] = fromBioText.map((p) => ({
      runs: [{ type: "text" as const, text: p }],
    }));
    if (hero.accentText?.trim()) {
      paragraphs.push({
        runs: [
          {
            type: hero.accentGradient !== false ? "gradient" : "text",
            text: hero.accentText.trim(),
          },
        ],
      });
    }
    return { paragraphs };
  }

  const paragraphs: BioParagraph[] = [classicBioDocumentFromHero(hero).paragraphs[0]];
  if (hero.accentText?.trim()) {
    paragraphs.push({
      runs: [
        {
          type: hero.accentGradient !== false ? "gradient" : "text",
          text: hero.accentText.trim(),
        },
      ],
    });
  }
  return { paragraphs };
}
