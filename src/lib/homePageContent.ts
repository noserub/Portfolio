/**
 * Home page CMS payload stored in `profiles.hero_text` and localStorage key `heroText`.
 * v2 wraps hero + stats + UI labels; legacy flat objects are migrated on read.
 */

import { resolveLogoImageUrl } from "../utils/imageOptimizer";
import {
  ensureLocalStorageHeadroom,
  isQuotaExceededError,
  safeLocalStorageSet,
} from "./safeLocalStorage";
import { clampLogoImageScale } from "./logoImageScale";

export const HOME_PAGE_CONTENT_VERSION = 2 as const;

/** Dispatched when leaving edit → preview so the home hero flushes any pending debounced save. */
export const FLUSH_HOME_PAGE_CMS_EVENT = "portfolio-flush-home-cms";

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

export type HeroRetypeMode = "full" | "suffix-only";

/** Modern home: animated typewriter vs fixed two-line headline (prefix + accent line). */
export type HeroHeadlineMode = "animated" | "static";

export interface HeroGreetingAnimationPlan {
  mode: HeroRetypeMode;
  greetings: string[];
  /** Shared prefix when mode is suffix-only (includes trailing space). */
  sharedPrefix?: string;
  suffixes?: string[];
}

export interface HeroTextState {
  greeting: string;
  greetings?: string[];
  /** Modern home headline presentation. Classic home ignores this and always animates. */
  heroHeadlineMode?: HeroHeadlineMode;
  /** Static mode line 1 (smaller, muted), e.g. "AI Product". */
  heroHeadlinePrefix?: string;
  /** Static mode line 2 (large accent), e.g. "Design Leader". */
  heroHeadlineMain?: string;
  /** When suffix-only, only the last word is deleted/retyped between lines with a shared prefix. */
  heroRetypeMode?: HeroRetypeMode;
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

/** Pause after each hero greeting finishes typing (before backspace or cycle wait). Not CMS-editable by design. */
export const HERO_SEQUENCE_PAUSE_MS = 2800;

/** Per-character typing delay (ms): min + random(0..range). */
export const HERO_TYPING_DELAY_MIN_MS = 58;
export const HERO_TYPING_DELAY_RANGE_MS = 52;

/** Backspace speed between characters (ms). */
export const HERO_DELETE_DELAY_MS = 38;

/** Pause after erasing before the next greeting starts (ms). */
export const HERO_BETWEEN_GREETINGS_PAUSE_MS = 480;

/** Minimum displayed length while backspacing in suffix-only mode (falls back to 0 in full mode). */
export function getHeroDeleteStopLength(plan: HeroGreetingAnimationPlan): number {
  return plan.mode === "suffix-only" && plan.sharedPrefix ? plan.sharedPrefix.length : 0;
}

/**
 * Build typing animation plan from hero greetings.
 * Suffix-only requires at least two lines that share the same text before the last space.
 */
export function getHeroGreetingAnimationPlan(
  greetings: string[],
  retypeMode: HeroRetypeMode = "full",
): HeroGreetingAnimationPlan {
  if (retypeMode !== "suffix-only" || greetings.length < 2) {
    return { mode: "full", greetings };
  }

  const parsed = greetings.map((line) => {
    const lastSpace = line.lastIndexOf(" ");
    if (lastSpace <= 0) return null;
    return {
      prefix: line.slice(0, lastSpace + 1),
      suffix: line.slice(lastSpace + 1),
    };
  });

  if (parsed.some((entry) => entry === null)) {
    return { mode: "full", greetings };
  }

  const sharedPrefix = parsed[0]!.prefix;
  if (!parsed.every((entry) => entry!.prefix === sharedPrefix)) {
    return { mode: "full", greetings };
  }

  return {
    mode: "suffix-only",
    greetings,
    sharedPrefix,
    suffixes: parsed.map((entry) => entry!.suffix),
  };
}

export const DEFAULT_HERO_HEADLINE_PREFIX = "AI Product";
export const DEFAULT_HERO_HEADLINE_MAIN = "Design Leader";

export function getHeroHeadlineMode(hero: HeroTextState): HeroHeadlineMode {
  return hero.heroHeadlineMode === "static" ? "static" : "animated";
}

/** Infer prefix line from animated greetings (suffix-only shared prefix or first line minus last word). */
export function inferHeroHeadlinePrefixFromGreetings(hero: HeroTextState): string | null {
  const lines = (hero.greetings?.length ? hero.greetings : [hero.greeting])
    .map((line) => line?.trim())
    .filter(Boolean) as string[];
  if (lines.length === 0) return null;

  const plan = getHeroGreetingAnimationPlan(lines, hero.heroRetypeMode ?? "full");
  if (plan.mode === "suffix-only" && plan.sharedPrefix) {
    return plan.sharedPrefix.trimEnd();
  }

  const first = lines[0];
  const lastSpace = first.lastIndexOf(" ");
  if (lastSpace > 0) return first.slice(0, lastSpace);
  return first;
}

/** Resolved static headline lines for display and CMS fallbacks. */
export function resolveStaticHeroHeadline(hero: HeroTextState): { prefix: string; main: string } {
  const prefix =
    hero.heroHeadlinePrefix?.trim() ||
    inferHeroHeadlinePrefixFromGreetings(hero) ||
    DEFAULT_HERO_HEADLINE_PREFIX;
  const main = hero.heroHeadlineMain?.trim() || DEFAULT_HERO_HEADLINE_MAIN;
  return { prefix, main };
}

/**
 * Split a hero main line for light-mode brand accent.
 * e.g. "AI Designer & Builder" → ink "AI Designer" + brand " & Builder".
 * Returns null when there's no " & " pair yet (typing mid-string, or different copy).
 */
export function splitHeroHeadlineBrandMoment(
  main: string,
): { ink: string; brand: string } | null {
  const idx = main.lastIndexOf(" & ");
  if (idx <= 0) return null;
  return {
    ink: main.slice(0, idx),
    brand: main.slice(idx),
  };
}

export interface HomePageStat {
  number: string;
  label: string;
  description: string;
}

/** Employer / client name for the home logo strip (text or optional image). */
export interface HomePageLogoEntry {
  name: string;
  imageUrl?: string | null;
  /** Display scale when the image file has excess padding (0.6–2, default 1). */
  imageScale?: number;
}

export interface HomePageLogoStrip {
  enabled: boolean;
  /** Optional label above the strip, e.g. "Previously at" */
  label?: string;
  entries: HomePageLogoEntry[];
}

export interface HomePageLeadershipStrip {
  enabled: boolean;
  /** Small accent label above the headline, e.g. "How I lead" */
  label?: string;
  headline: string;
  subhead?: string;
  bullets: string[];
}

/** Slugs match `projects.project_type` / `ProjectData.projectType`. */
export const CASE_STUDY_FILTER_TYPE_IDS = ["product-design", "development", "branding"] as const;
export type CaseStudyFilterTypeId = (typeof CASE_STUDY_FILTER_TYPE_IDS)[number];

export interface CaseStudyFilterEntry {
  id: CaseStudyFilterTypeId;
  label: string;
}

/** Initial case study filter when the home page loads (`"all"` = show every category). */
export type DefaultCaseStudyFilter = "all" | CaseStudyFilterTypeId;

export interface HomePageUI {
  caseStudiesTitle: string;
  filterAll: string;
  /** Modern home hero: primary CTA (scrolls to case studies). */
  workCtaLabel: string;
  /** Modern home hero: secondary ghost (navigates to About / how I work). */
  processCtaLabel: string;
  /** Modern home hero: secondary ghost (navigates to contact). */
  contactCtaLabel: string;
  /** Which category filters appear on the home case studies row (subset/order/labels). */
  caseStudyFilters: CaseStudyFilterEntry[];
  /** Which filter is selected for visitors until they click another (must match an enabled category or `"all"`). */
  defaultCaseStudyFilter: DefaultCaseStudyFilter;
  /** Modern home: wide hero card. When null or not in the current filter, falls back to first by sort order. */
  featuredCaseStudyId?: string | null;
}

export interface HomePageContentV2 {
  _version: typeof HOME_PAGE_CONTENT_VERSION;
  hero: HeroTextState;
  stats: HomePageStat[];
  logoStrip?: HomePageLogoStrip;
  leadershipStrip?: HomePageLeadershipStrip;
  ui: HomePageUI;
  /** Set on each persist so refresh can prefer newer local draft if Supabase is stale. */
  _clientSavedAt?: number;
}

export type HomePagePersisted = HomePageContentV2;

/** Director / Principal IC proof metrics — business outcomes + scale, not builder hobby stats. */
export const DEFAULT_STATS: HomePageStat[] = [
  {
    number: "AI",
    label: "AI design leadership",
    description: "Generative AI, agents, and trust UX from pilot to GA",
  },
  {
    number: "7",
    label: "0→1 product launches",
    description: "Concept to production · t:slim insulin pump (FDA-cleared) · Skype Qik",
  },
  {
    number: "9",
    label: "US patents",
    description: "Medical devices & product innovation",
  },
  {
    number: "100M+",
    label: "Users reached",
    description: "Skype for Android · Moto 360 · t:slim",
  },
];

/** Prior default stats that read IC/builder — auto-upgrade on load when fingerprint matches exactly. */
const LEGACY_BUILDER_STATS: HomePageStat[] = [
  { number: "1", label: "Full stack web app", description: "Solo developer" },
  { number: "4", label: "AI native apps designed", description: "with RAG & MCP hooks" },
  { number: "6", label: "0-1 product launches", description: "From ambiguity to product" },
  { number: "9", label: "US patents", description: "Innovation and IP contribution" },
];

const LEGACY_HOME_STATS_SETS: HomePageStat[][] = [
  [
    { number: "4", label: "AI-native products", description: "" },
    { number: "7", label: "0-1 product launches", description: "" },
    { number: "9", label: "US patents", description: "" },
    { number: "100M+", label: "Users at global scale", description: "" },
  ],
  [
    { number: "100M+", label: "People reached", description: "Skype, Moto 360, t:slim insulin pump" },
    { number: "300%", label: "Engagement growth", description: "MassRoots platform turnaround" },
    { number: "1M+", label: "Users scaled", description: "Cannabis discovery platform" },
    { number: "20+", label: "Years in product design", description: "Enterprise, medical, consumer, AI" },
  ],
];

function statsFingerprint(stats: HomePageStat[]): string {
  return JSON.stringify(stats.map((s) => ({ number: s.number, label: s.label, description: s.description })));
}

function isLegacyBuilderStats(stats: HomePageStat[]): boolean {
  return statsFingerprint(stats) === statsFingerprint(LEGACY_BUILDER_STATS);
}

function isLegacyHomeStats(stats: HomePageStat[]): boolean {
  const fp = statsFingerprint(stats);
  if (LEGACY_HOME_STATS_SETS.some((legacy) => statsFingerprint(legacy) === fp)) {
    return true;
  }
  // CMS row with empty or customized descriptions (4 AI-native · 7 launches · 9 patents · 100M+)
  if (stats.length !== 4) return false;
  const [a, b, c, d] = stats;
  return (
    a.number.trim() === "4" &&
    /ai[- ]?native/i.test(a.label) &&
    b.number.trim() === "7" &&
    /0.?1|0→1/i.test(b.label) &&
    c.number.trim() === "9" &&
    /patent/i.test(c.label) &&
    d.number.trim() === "100M+"
  );
}

export const DEFAULT_LOGO_STRIP: HomePageLogoStrip = {
  enabled: true,
  label: "Previously at",
  entries: [
    { name: "Oracle" },
    { name: "Microsoft" },
    { name: "Skype" },
    { name: "Tandem" },
    { name: "Motorola" },
  ],
};

export const DEFAULT_LEADERSHIP_STRIP: HomePageLeadershipStrip = {
  enabled: true,
  label: "How I lead",
  headline: "Player coach ... I lead design through dev.",
  subhead:
    "I lead by doing. I get the right things done. I untangle gnarly problems for the biggest impact.",
  bullets: [
    "Built and led design orgs (up to 7 designers): hiring, critique, career ladders, and delivery culture",
    "0→1 and platform-scale work in regulated, medical, and enterprise AI",
    "Enterprise AI at global scale: conversational search, governed assistants, and trust UX",
    "Design → Code workflow: research, design systems, prototypes, and production-ready code",
  ],
};

/** Prior leadership strip defaults — auto-upgrade on load when fingerprint matches exactly. */
const LEGACY_LEADERSHIP_STRIPS: HomePageLeadershipStrip[] = [
  {
    enabled: true,
    label: "How I lead",
    headline: "Player coach. I lead design through dev.",
    bullets: [
      "I lead by doing.",
      "I get the right things done.",
      "I untangle gnarly problems for the biggest impact.",
    ],
  },
  {
    enabled: true,
    label: "How I lead",
    headline: "Most teams stop at the pilot. I lead design through GA.",
    subhead:
      "I align executives, product, and engineering on strategy, then stay close to the craft from research through production-ready code. My lane is high-stakes products: regulated, medical, and enterprise AI made to feel trustworthy and shippable.",
    bullets: [
      "Built and led design orgs (up to 7 designers): hiring, critique, career ladders, and delivery culture",
      "0→1 and platform-scale work in regulated, medical, and enterprise AI",
      "Enterprise AI at global scale: conversational search, governed assistants, and trust UX from pilot to GA",
      "Design → Code workflow: research, design systems, prototypes, and production-ready code",
    ],
  },
  {
    enabled: true,
    label: "How I lead",
    headline: "Most teams stop at the pilot. I lead design through GA.",
    subhead:
      "I align executives, product, and engineering on strategy, then stay close to the craft from research through production-ready code. My lane is high-stakes products: regulated, medical, and enterprise AI made to feel trustworthy and shippable.",
    bullets: [
      "Built and led design orgs (up to 4 designers): hiring, critique, career ladders, and delivery culture",
      "Executive partnership on roadmap and cross-functional alignment in ambiguous, high-risk bets",
      "Enterprise AI at global scale: conversational search, governed assistants, and trust UX from pilot to GA",
      "Still ships: research, design systems, prototypes, and production-ready code",
    ],
  },
  {
    enabled: true,
    label: "How I lead",
    headline: "Design leadership for products that have to ship.",
    subhead:
      "I align executives, product, and engineering on strategy, then stay close to the craft from research through production-ready code. My lane is high-stakes products: regulated, medical, and enterprise AI made to feel trustworthy and shippable.",
    bullets: [
      "Built and led design orgs (up to 4 designers): hiring, critique, career ladders, and delivery culture",
      "Executive partnership on roadmap and cross-functional alignment in ambiguous, high-risk bets",
      "Enterprise AI at global scale: conversational search, governed assistants, and trust UX from pilot to GA",
      "Still ships: research, design systems, prototypes, and production-ready code",
    ],
  },
  {
    enabled: true,
    label: "How I lead",
    headline: "Hands-on design leadership. Strategy set, work shipped.",
    subhead:
      "I align executives, product, and engineering on strategy, then stay close to the craft from research through production-ready code. My lane is high-stakes products: regulated, medical, and enterprise AI made to feel trustworthy and shippable.",
    bullets: [
      "Built and led design orgs (up to 4 designers): hiring, critique, career ladders, and delivery culture",
      "Executive partnership on roadmap and cross-functional alignment in ambiguous, high-risk bets",
      "Enterprise AI at global scale: conversational search, governed assistants, and trust UX from pilot to GA",
      "Still ships: research, design systems, prototypes, and production-ready code",
    ],
  },
  {
    enabled: true,
    label: "Design leadership",
    headline: "Design leadership for high-stakes products.",
    subhead:
      "I align executives, product, and engineering on strategy, then drive the work from research through shipped code.",
    bullets: [
      "Built and led design orgs (up to 4 designers): career ladders, critique, hiring, and delivery culture",
      "Executive partnership on roadmap, GTM, and cross-functional alignment in ambiguous, high-risk bets",
      "0→1 and platform-scale work in regulated, medical, and enterprise AI contexts",
      "Still ships: research, design systems, prototypes, and production-ready code",
    ],
  },
  {
    enabled: true,
    headline: "Design leadership for high-stakes products.",
    subhead:
      "I align executives, product, and engineering on strategy, then drive the work from research through shipped code.",
    bullets: [
      "Built and led design orgs (up to 4 designers): career ladders, critique, hiring, and delivery culture",
      "Executive partnership on roadmap, GTM, and cross-functional alignment in ambiguous, high-risk bets",
      "0→1 and platform-scale work in regulated, medical, and enterprise AI contexts",
      "Still ships: research, design systems, prototypes, and production-ready code",
    ],
  },
];

function leadershipStripFingerprint(strip: HomePageLeadershipStrip): string {
  return JSON.stringify({
    label: strip.label ?? "",
    headline: strip.headline,
    subhead: strip.subhead ?? "",
    bullets: strip.bullets,
  });
}

function isLegacyLeadershipStrip(strip: HomePageLeadershipStrip): boolean {
  const fp = leadershipStripFingerprint(strip);
  return LEGACY_LEADERSHIP_STRIPS.some((legacy) => leadershipStripFingerprint(legacy) === fp);
}

export const DEFAULT_CASE_STUDY_FILTERS: CaseStudyFilterEntry[] = [
  { id: "product-design", label: "Product design" },
  { id: "development", label: "Development" },
  { id: "branding", label: "Branding" },
];

export const DEFAULT_UI: HomePageUI = {
  caseStudiesTitle: "Case studies",
  filterAll: "All",
  workCtaLabel: "Selected work",
  processCtaLabel: "How I work",
  contactCtaLabel: "Discuss a partnership",
  caseStudyFilters: DEFAULT_CASE_STUDY_FILTERS.map((f) => ({ ...f })),
  defaultCaseStudyFilter: "all",
  featuredCaseStudyId: null,
};

/** Default segment strings for initial hero state and legacy migration when building bioDocument. */
export const DEFAULT_CLASSIC_BIO_FIELDS = {
  subtitle: `Director-level design leader with 20+ years building regulated, high-stakes systems: medical devices, enterprise software, and frontier AI. I architect product strategy, UX, and execution from research and design systems through prototypes and production-ready code.`,
  description: "",
  word1: "help teams",
  word2: "move",
  word3: "from ambiguity",
  word4: "to execution",
} as const;

/** True when the doc uses bold/gradient runs but every one is empty — shows only ", , , and ." in production. */
export function hasEmptyClassicShell(doc: BioDocument | undefined): boolean {
  if (!doc?.paragraphs?.length) return false;
  let sawStyled = false;
  let anyStyledHasText = false;
  for (const p of doc.paragraphs) {
    for (const r of p.runs || []) {
      if (r.type === "bold" || r.type === "gradient") {
        sawStyled = true;
        if ((r.text || "").trim().length > 0) {
          anyStyledHasText = true;
        }
      }
    }
  }
  return sawStyled && !anyStyledHasText;
}

export function coerceClassicBioFields(
  hero: Pick<HeroTextState, "subtitle" | "description" | "word1" | "word2" | "word3" | "word4">,
): {
  subtitle: string;
  description: string;
  word1: string;
  word2: string;
  word3: string;
  word4: string;
} {
  const d = DEFAULT_CLASSIC_BIO_FIELDS;
  return {
    subtitle: hero.subtitle?.trim() || d.subtitle,
    description: hero.description?.trim() || d.description,
    word1: hero.word1?.trim() || d.word1,
    word2: hero.word2?.trim() || d.word2,
    word3: hero.word3?.trim() || d.word3,
    word4: hero.word4?.trim() || d.word4,
  };
}

/** Plain paragraphs (line break between sections); no bold or gradient runs. Skips empty subtitle/description so one block can stand alone. */
export function plainBioDocumentFromHeroFields(fields: {
  subtitle: string;
  description: string;
}): BioDocument {
  const paragraphs: BioParagraph[] = [];
  const sub = typeof fields.subtitle === "string" ? fields.subtitle.trim() : "";
  const desc = typeof fields.description === "string" ? fields.description.trim() : "";
  if (sub) paragraphs.push({ runs: [{ type: "text", text: sub }] });
  if (desc) paragraphs.push({ runs: [{ type: "text", text: desc }] });
  if (paragraphs.length === 0) {
    paragraphs.push({ runs: [{ type: "text", text: "" }] });
  }
  return { paragraphs };
}

/** Canonical default home bio (matches `defaultHeroTextState` copy). */
export const DEFAULT_BIO_DOCUMENT: BioDocument = plainBioDocumentFromHeroFields({
  subtitle: DEFAULT_CLASSIC_BIO_FIELDS.subtitle,
  description: DEFAULT_CLASSIC_BIO_FIELDS.description,
});

/** Old single-paragraph template: bold lead + gradient phrases — migrate to plain two paragraphs. */
function isStoredClassicTemplateBio(doc: BioDocument): boolean {
  if (doc.paragraphs.length !== 1) return false;
  const runs = doc.paragraphs[0]?.runs ?? [];
  if (runs.length < 5) return false;
  if (runs[0]?.type !== "bold") return false;
  return runs.some((r) => r.type === "gradient");
}

function shouldMigrateStoredClassicBioToPlain(sanitized: BioDocument, hero: HeroTextState): boolean {
  if (!isStoredClassicTemplateBio(sanitized)) return false;
  const boldRun = sanitized.paragraphs[0]?.runs?.[0];
  if (boldRun?.type !== "bold") return false;
  const boldText = (boldRun.text ?? "").trim();
  const f = coerceClassicBioFields(hero);
  return (
    boldText === f.subtitle.trim() ||
    boldText === DEFAULT_CLASSIC_BIO_FIELDS.subtitle.trim()
  );
}

export function cloneBioDocument(doc: BioDocument): BioDocument {
  return {
    paragraphs: doc.paragraphs.map((p) => ({
      runs: p.runs.map((r) => ({ ...r })),
    })),
  };
}

export function defaultBioDocument(): BioDocument {
  return cloneBioDocument(DEFAULT_BIO_DOCUMENT);
}

export function healDegenerateHeroBio(hero: HeroTextState): HeroTextState {
  const sanitized = hero.bioDocument ? sanitizeBioDocument(hero.bioDocument) : null;
  if (!sanitized?.paragraphs?.length || !hasEmptyClassicShell(sanitized)) {
    return hero;
  }
  const fields = coerceClassicBioFields(hero);
  return {
    ...hero,
    subtitle: fields.subtitle,
    description: fields.description,
    word1: fields.word1,
    word2: fields.word2,
    word3: fields.word3,
    word4: fields.word4,
    bioDocument: plainBioDocumentFromHeroFields({
      subtitle: fields.subtitle,
      description: fields.description,
    }),
  };
}

export function defaultHeroTextState(): HeroTextState {
  const f = DEFAULT_CLASSIC_BIO_FIELDS;
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
    subtitle: f.subtitle,
    description: f.description,
    word1: f.word1,
    word2: f.word2,
    word3: f.word3,
    word4: f.word4,
    buttonText: "About Brian",
    accentGradient: true,
    bioParagraphGapRem: 1,
    bioLineHeight: 1.625,
    accentMarginTopRem: 1,
  };
  return {
    ...hero,
    bioDocument: defaultBioDocument(),
  };
}

export function mergeLogoStrip(raw: unknown): HomePageLogoStrip {
  const base = DEFAULT_LOGO_STRIP;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...base, entries: base.entries.map((e) => ({ ...e })) };
  }
  const o = raw as Record<string, unknown>;
  const entries = Array.isArray(o.entries)
    ? o.entries
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const r = item as Record<string, unknown>;
          const name = String(r.name ?? "").trim();
          if (!name) return null;
          const imageUrl = resolveLogoImageUrl(r.imageUrl ?? r.image_url ?? r.url);
          const imageScale = clampLogoImageScale(r.imageScale);
          return { name, imageUrl, imageScale };
        })
        .filter(Boolean) as HomePageLogoEntry[]
    : base.entries.map((e) => ({ ...e }));
  return {
    enabled: o.enabled !== false,
    label: typeof o.label === "string" ? o.label : base.label,
    entries: entries.length > 0 ? entries : base.entries.map((e) => ({ ...e })),
  };
}

export function mergeLeadershipStrip(raw: unknown): HomePageLeadershipStrip {
  const base = DEFAULT_LEADERSHIP_STRIP;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ...base,
      bullets: [...base.bullets],
    };
  }
  const o = raw as Record<string, unknown>;
  const bullets = Array.isArray(o.bullets)
    ? o.bullets.map((b) => String(b ?? "").trim()).filter(Boolean)
    : [...base.bullets];
  const merged: HomePageLeadershipStrip = {
    enabled: o.enabled !== false,
    label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : base.label,
    headline: String(o.headline ?? base.headline).trim() || base.headline,
    subhead:
      typeof o.subhead === "string" && o.subhead.trim() ? o.subhead.trim() : base.subhead,
    bullets: bullets.length > 0 ? bullets : [...base.bullets],
  };
  if (isLegacyLeadershipStrip(merged)) {
    return {
      ...DEFAULT_LEADERSHIP_STRIP,
      bullets: [...DEFAULT_LEADERSHIP_STRIP.bullets],
    };
  }
  return merged;
}

/** Ensure logo/leadership strips and stats always hydrate from defaults when fields are missing. */
export function normalizeHomePageContent(content: HomePageContentV2): HomePageContentV2 {
  return {
    ...content,
    stats: mergeStats(content.stats),
    logoStrip: mergeLogoStrip(content.logoStrip),
    leadershipStrip: mergeLeadershipStrip(content.leadershipStrip),
    ui: mergeUI(content.ui),
  };
}

function remotePayloadHadStripField(rawRemote: unknown, field: "logoStrip" | "leadershipStrip"): boolean {
  const obj = coerceHomeContentJsonToObject(rawRemote);
  return obj != null && Object.prototype.hasOwnProperty.call(obj, field);
}

/**
 * When a newer local draft wins over cloud, do not keep disabled strips if the published
 * row never stored those fields (common after older saves that omitted logo/leadership).
 */
function mergeRemoteStripDefaults(
  preferred: HomePageContentV2,
  remote: HomePageContentV2,
  rawRemote: unknown,
): HomePageContentV2 {
  const remoteHadLogo = remotePayloadHadStripField(rawRemote, "logoStrip");
  const remoteHadLeadership = remotePayloadHadStripField(rawRemote, "leadershipStrip");
  return {
    ...preferred,
    logoStrip:
      !remoteHadLogo && preferred.logoStrip?.enabled === false
        ? mergeLogoStrip(remote.logoStrip)
        : mergeLogoStrip(preferred.logoStrip),
    leadershipStrip:
      !remoteHadLeadership && preferred.leadershipStrip?.enabled === false
        ? mergeLeadershipStrip(remote.leadershipStrip)
        : mergeLeadershipStrip(preferred.leadershipStrip),
  };
}

export function createDefaultHomePageContent(): HomePageContentV2 {
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: defaultHeroTextState(),
    stats: DEFAULT_STATS.map((s) => ({ ...s })),
    logoStrip: mergeLogoStrip(DEFAULT_LOGO_STRIP),
    leadershipStrip: mergeLeadershipStrip(DEFAULT_LEADERSHIP_STRIP),
    ui: { ...DEFAULT_UI },
  };
}

const LEGACY_WELCOME_GREETING = "Welcome,";
const LEGACY_WELCOME_REPLACEMENT = "I build things.";

/**
 * Old templates stored greeting "Welcome," — do NOT reset the whole home CMS to defaults.
 * Only swap the legacy string so stats, bio, and filter labels stay intact.
 */
export function migrateLegacyWelcomeGreeting(c: HomePageContentV2): HomePageContentV2 {
  const h = c.hero;
  const hasLegacy =
    h.greeting === LEGACY_WELCOME_GREETING ||
    (h.greetings ?? []).some((x) => x === LEGACY_WELCOME_GREETING);

  if (!hasLegacy) {
    return c;
  }

  const sourceLines = h.greetings?.length ? [...h.greetings] : [h.greeting];
  const nextGreetings = sourceLines.map((s) =>
    s === LEGACY_WELCOME_GREETING ? LEGACY_WELCOME_REPLACEMENT : s,
  );
  const nextGreeting =
    h.greeting === LEGACY_WELCOME_GREETING ? LEGACY_WELCOME_REPLACEMENT : h.greeting;

  return {
    ...c,
    hero: {
      ...h,
      greeting: nextGreeting,
      greetings: nextGreetings.length ? nextGreetings : defaultHeroTextState().greetings,
    },
  };
}

/**
 * While editing hero, animated headline lines may only exist in the textarea until blur.
 * Merge draft text into the persisted hero so autosave / flush / Done include the latest lines.
 */
export function mergeHeroGreetingsFromDraftLines(
  content: HomePageContentV2,
  greetingsDraftText: string,
): HomePageContentV2 {
  const greetings = greetingsDraftText
    .split("\n")
    .map((g) => g.trim())
    .filter(Boolean);
  if (greetings.length === 0) {
    return content;
  }
  return {
    ...content,
    hero: {
      ...content.hero,
      greetings,
      greeting: greetings[0],
    },
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
    heroHeadlineMode: h.heroHeadlineMode === "static" ? "static" : "animated",
    heroHeadlinePrefix:
      typeof h.heroHeadlinePrefix === "string" && h.heroHeadlinePrefix.trim()
        ? h.heroHeadlinePrefix.trim()
        : undefined,
    heroHeadlineMain:
      typeof h.heroHeadlineMain === "string" && h.heroHeadlineMain.trim()
        ? h.heroHeadlineMain.trim()
        : undefined,
    heroRetypeMode: h.heroRetypeMode === "suffix-only" ? "suffix-only" : "full",
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
  return healDegenerateHeroBio(merged);
}

function mergeStats(raw: unknown): HomePageStat[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_STATS.map((s) => ({ ...s }));
  }
  const merged = raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      number: String(o.number ?? ""),
      label: String(o.label ?? ""),
      description: String(o.description ?? ""),
    };
  });
  if (isLegacyBuilderStats(merged) || isLegacyHomeStats(merged)) {
    return DEFAULT_STATS.map((s) => ({ ...s }));
  }
  return merged;
}

/** Stats may live at root or (legacy / bad exports) under `hero.stats` — never drop them when `stats` is missing at root. */
function pickStatsArrayFromStored(obj: Record<string, unknown>): unknown {
  if (Array.isArray(obj.stats) && obj.stats.length > 0) {
    return obj.stats;
  }
  const hero = obj.hero;
  if (hero && typeof hero === "object" && Array.isArray((hero as Record<string, unknown>).stats)) {
    return (hero as Record<string, unknown>).stats;
  }
  return obj.stats;
}

const KNOWN_FILTER_ID = new Set<string>(CASE_STUDY_FILTER_TYPE_IDS);

function normalizeDefaultCaseStudyFilter(
  raw: unknown,
  caseStudyFilters: CaseStudyFilterEntry[],
): DefaultCaseStudyFilter {
  const s = String(raw ?? "all").trim().toLowerCase();
  if (s === "" || s === "all") return "all";
  if (!KNOWN_FILTER_ID.has(s)) return "all";
  const id = s as CaseStudyFilterTypeId;
  const allowed = new Set(caseStudyFilters.map((f) => f.id));
  if (allowed.size === 0) return "all";
  if (!allowed.has(id)) return "all";
  return id;
}

function normalizeCaseStudyFilters(raw: unknown): CaseStudyFilterEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: CaseStudyFilterEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    const label = String(r.label ?? "").trim();
    if (!id || !label || !KNOWN_FILTER_ID.has(id)) continue;
    out.push({ id: id as CaseStudyFilterTypeId, label });
  }
  return out;
}

/** Legacy payloads stored three separate label strings before `caseStudyFilters` existed. */
function mergeUI(raw: unknown): HomePageUI {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hasCaseStudyFiltersKey = Object.prototype.hasOwnProperty.call(o, "caseStudyFilters");

  let caseStudyFilters: CaseStudyFilterEntry[];
  if (hasCaseStudyFiltersKey) {
    caseStudyFilters = normalizeCaseStudyFilters(o.caseStudyFilters);
  } else {
    const legacy = o as Partial<{
      filterProductDesign?: string;
      filterDevelopment?: string;
      filterBranding?: string;
    }>;
    caseStudyFilters = [
      { id: "product-design", label: String(legacy.filterProductDesign ?? "Product design") },
      { id: "development", label: String(legacy.filterDevelopment ?? "Development") },
      { id: "branding", label: String(legacy.filterBranding ?? "Branding") },
    ];
  }

  const defaultCaseStudyFilter = normalizeDefaultCaseStudyFilter(
    o.defaultCaseStudyFilter,
    caseStudyFilters,
  );

  return {
    caseStudiesTitle: String(o.caseStudiesTitle ?? DEFAULT_UI.caseStudiesTitle),
    filterAll: String(o.filterAll ?? DEFAULT_UI.filterAll),
    workCtaLabel: String(o.workCtaLabel ?? DEFAULT_UI.workCtaLabel),
    processCtaLabel: String(o.processCtaLabel ?? DEFAULT_UI.processCtaLabel),
    contactCtaLabel: (() => {
      const raw = String(o.contactCtaLabel ?? DEFAULT_UI.contactCtaLabel);
      // Soft-migrate previous default so the new ghost label shows without a manual CMS edit.
      return raw === "Get in touch" ? DEFAULT_UI.contactCtaLabel : raw;
    })(),
    caseStudyFilters,
    defaultCaseStudyFilter,
    featuredCaseStudyId:
      typeof o.featuredCaseStudyId === "string" && o.featuredCaseStudyId.trim()
        ? o.featuredCaseStudyId.trim()
        : null,
  };
}

/**
 * JSONB from Postgres or copy-paste in the dashboard may arrive as a JSON **string**.
 * Arrays are rejected — valid payload is always a plain object.
 */
function coerceHomeContentJsonToObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      const parsed = JSON.parse(t) as unknown;
      return coerceHomeContentJsonToObject(parsed);
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object") return null;
  if (Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/**
 * v2 payloads store fields under `hero`. That value may be a plain object **or** a JSON string
 * (double-encoded JSONB / dashboard paste). Arrays are invalid hero payloads.
 */
function normalizeNestedHeroField(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    return coerceHomeContentJsonToObject(raw);
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/**
 * Legacy flat shape may still carry `hero` as a string; spreading that into mergeHero drops real
 * greeting/subtitle into a useless `hero` property and shows defaults.
 */
function mergeHeroFromLegacyFlat(heroFlat: Record<string, unknown>): HeroTextState {
  const hf: Record<string, unknown> = { ...heroFlat };
  const hHero = hf.hero;
  if (typeof hHero === "string") {
    const parsed = coerceHomeContentJsonToObject(hHero);
    delete hf.hero;
    if (parsed) {
      return mergeHero({ ...hf, ...parsed });
    }
  }
  if (hHero !== undefined && (typeof hHero !== "object" || Array.isArray(hHero))) {
    delete hf.hero;
  }
  return mergeHero(hf);
}

/** Normalize Supabase / localStorage JSON into v2 content. */
export function parseStoredHomeContent(raw: unknown): HomePageContentV2 {
  const obj = coerceHomeContentJsonToObject(raw);
  if (!obj) {
    return createDefaultHomePageContent();
  }

  const ts = obj._clientSavedAt;
  const tsOpt =
    typeof ts === "number" && !Number.isNaN(ts) ? { _clientSavedAt: ts } : {};

  // Nested hero (v2) — include when _version was omitted by older saves; `hero` may be a JSON string
  const nestedHero = normalizeNestedHeroField(obj.hero);
  if (nestedHero) {
    const { stats: _statsInsideHero, ...heroWithoutStats } = nestedHero;
    return normalizeHomePageContent({
      _version: HOME_PAGE_CONTENT_VERSION,
      hero: mergeHero(heroWithoutStats),
      stats: mergeStats(pickStatsArrayFromStored(obj)),
      logoStrip: mergeLogoStrip(obj.logoStrip),
      leadershipStrip: mergeLeadershipStrip(obj.leadershipStrip),
      ui: mergeUI(obj.ui),
      ...tsOpt,
    });
  }

  // Legacy flat: greeting/subtitle/… at root — often had stats/ui added later; do not drop them
  const {
    stats: rawStats,
    ui: rawUi,
    _version: _ignoredVersion,
    _clientSavedAt: _ignoredSavedAt,
    ...heroFlat
  } = obj;

  return normalizeHomePageContent({
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: mergeHeroFromLegacyFlat(heroFlat as Record<string, unknown>),
    stats: mergeStats(
      rawStats !== undefined && rawStats !== null
        ? rawStats
        : pickStatsArrayFromStored(obj),
    ),
    logoStrip: mergeLogoStrip(obj.logoStrip),
    leadershipStrip: mergeLeadershipStrip(obj.leadershipStrip),
    ui: mergeUI(rawUi),
    ...tsOpt,
  });
}

export function toPersistedPayload(content: HomePageContentV2): HomePagePersisted {
  const normalized = normalizeHomePageContent(content);
  const ts = normalized._clientSavedAt;
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: { ...normalized.hero },
    stats: normalized.stats.map((s) => ({ ...s })),
    logoStrip: {
      ...normalized.logoStrip!,
      entries: normalized.logoStrip!.entries.map((e) => ({
        ...e,
        imageUrl: resolveLogoImageUrl(e.imageUrl),
        imageScale: clampLogoImageScale(e.imageScale),
      })),
    },
    leadershipStrip: {
      ...normalized.leadershipStrip!,
      bullets: [...normalized.leadershipStrip!.bullets],
    },
    ui: { ...normalized.ui },
    ...(typeof ts === "number" && !Number.isNaN(ts) ? { _clientSavedAt: ts } : {}),
  };
}

/** Drop inlined logo bytes from a local draft. Cloud payload stays full. */
export function slimHomePagePayloadForLocalStorage(
  payload: HomePagePersisted,
): HomePagePersisted {
  const strip = payload.logoStrip;
  if (!strip?.entries?.length) return payload;
  return {
    ...payload,
    logoStrip: {
      ...strip,
      entries: strip.entries.map((e) => {
        const url = typeof e.imageUrl === "string" ? e.imageUrl : "";
        if (url.startsWith("data:")) {
          return { ...e, imageUrl: null };
        }
        return e;
      }),
    },
  };
}

/**
 * Write `heroText` draft to localStorage without throwing on quota.
 * Retries after prune / remove-old / slim logos. Returns whether the write stuck.
 */
export function writeHomePageToLocalStorage(content: HomePageContentV2): {
  ok: boolean;
  slimmed: boolean;
} {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return { ok: false, slimmed: false };
  }

  const full = toPersistedPayload(content);
  const fullJson = JSON.stringify(full);

  const trySet = (json: string): boolean => {
    if (safeLocalStorageSet("heroText", json)) return true;
    try {
      globalThis.localStorage.removeItem("heroText");
    } catch {
      // ignore
    }
    ensureLocalStorageHeadroom();
    try {
      globalThis.localStorage.setItem("heroText", json);
      return true;
    } catch (err) {
      if (!isQuotaExceededError(err)) {
        console.warn("localStorage heroText write failed:", err);
      }
      return false;
    }
  };

  if (trySet(fullJson)) return { ok: true, slimmed: false };

  const slimJson = JSON.stringify(slimHomePagePayloadForLocalStorage(full));
  if (slimJson !== fullJson && trySet(slimJson)) {
    console.warn(
      "heroText local draft saved without inlined logo images (storage quota). Cloud save still uses full images.",
    );
    return { ok: true, slimmed: true };
  }

  console.warn("heroText could not be written to localStorage (quota full).");
  return { ok: false, slimmed: false };
}

export function heroHasMinimumContent(hero: HeroTextState): boolean {
  if (getHeroHeadlineMode(hero) === "static") {
    const { prefix, main } = resolveStaticHeroHeadline(hero);
    if (prefix.trim() && main.trim()) return true;
  }
  return (hero.greetings?.length ?? 0) > 0 || Boolean(hero.greeting?.trim());
}

/**
 * True when the home CMS payload is worth persisting (autosave / localStorage / Supabase).
 * Do not gate on greetings alone — stats, filter labels, and bio edits must save even if
 * rotating greetings are temporarily empty.
 */
export function shouldPersistHomePageContent(c: HomePageContentV2): boolean {
  if (heroHasMinimumContent(c.hero)) return true;
  const baseline = createDefaultHomePageContent();
  const strip = (x: HomePageContentV2) => {
    const { _clientSavedAt: _a, ...rest } = x;
    return rest;
  };
  return JSON.stringify(strip(c)) !== JSON.stringify(strip(baseline));
}

/**
 * Synchronous local backup — safe for beforeunload (Supabase cannot finish in time).
 * Returns false when there is nothing meaningful to store or quota blocks the write.
 */
export function persistHomePageToLocalStorageSync(c: HomePageContentV2): boolean {
  if (!shouldPersistHomePageContent(c)) return false;
  return writeHomePageToLocalStorage({ ...c, _clientSavedAt: Date.now() }).ok;
}

/** Parsed `heroText` from localStorage, or null if missing / invalid / empty. */
export function readHomePageContentFromLocalStorage(): HomePageContentV2 | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  try {
    const saved = globalThis.localStorage.getItem("heroText");
    if (!saved) return null;
    const content = parseStoredHomeContent(JSON.parse(saved) as unknown);
    if (!shouldPersistHomePageContent(content)) return null;
    return content;
  } catch {
    return null;
  }
}

export interface ResolveHomeContentOptions {
  /**
   * `profiles.updated_at` (ms). Used when `hero_text` JSON omits `_clientSavedAt`
   * (e.g. edits in the Supabase dashboard) so the server copy still wins over stale local drafts.
   */
  remoteProfileUpdatedAtMs?: number | null;
  /**
   * Only the portfolio owner, signed in via Supabase (real session), may see a newer local draft
   * over remote. Never set for visitors, bypass-only flags, or non-owner accounts — otherwise
   * stale `localStorage` can mask published `profiles.hero_text` for everyone on that device.
   */
  allowLocalDraftPreference?: boolean;
}

export interface ResolveHomeContentResult {
  content: HomePageContentV2;
  /** True when a local draft existed but the published Supabase copy was shown instead. */
  localDraftSupersededByCloud: boolean;
  /**
   * True when signed in and this device has a newer draft than the cloud row.
   * Visitors/incognito always see cloud — this flags that they may see older content until sync succeeds.
   */
  draftAheadOfPublished: boolean;
}

/**
 * After fetching `profiles.hero_text`, pick what to show when the row is missing or load failed.
 * - Default: published `remote` only — visitors and non-owner sessions never read stale `heroText`.
 * - When `allowLocalDraftPreference` is true (owner signed in via Supabase): prefer local if its
 *   `_clientSavedAt` beats remote (editing drafts). Use `hero_text._clientSavedAt` when set; if
 *   missing, fall back to `profiles.updated_at`.
 */
export function resolveHomeContentAfterLoad(
  rawRemote: unknown,
  options?: ResolveHomeContentOptions,
): ResolveHomeContentResult {
  const remote = parseStoredHomeContent(rawRemote ?? {});
  const local = readHomePageContentFromLocalStorage();
  const profileMs = options?.remoteProfileUpdatedAtMs;
  const remoteProfileAt =
    typeof profileMs === "number" && !Number.isNaN(profileMs) ? profileMs : 0;

  const localValid = Boolean(local && shouldPersistHomePageContent(local));
  const allowLocal = Boolean(options?.allowLocalDraftPreference);

  if (!allowLocal) {
    // Published remote (or parsed defaults) only — never blend in localStorage.
    return {
      content: normalizeHomePageContent(remote),
      localDraftSupersededByCloud: false,
      draftAheadOfPublished: false,
    };
  }

  if (localValid) {
    const lt = local!._clientSavedAt ?? 0;
    const rtFromJson = remote._clientSavedAt ?? 0;
    const rt =
      rtFromJson > 0
        ? rtFromJson
        : remoteProfileAt > 0
          ? remoteProfileAt
          : 0;
    if (lt > rt) {
      return {
        content: normalizeHomePageContent(
          mergeRemoteStripDefaults(local!, remote, rawRemote),
        ),
        localDraftSupersededByCloud: false,
        draftAheadOfPublished: true,
      };
    }
    return {
      content: normalizeHomePageContent(remote),
      localDraftSupersededByCloud: true,
      draftAheadOfPublished: false,
    };
  }

  return {
    content: normalizeHomePageContent(remote),
    localDraftSupersededByCloud: false,
    draftAheadOfPublished: false,
  };
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

export function legacyToBioDocument(hero: HeroTextState): BioDocument {
  const raw = hero.bioDocument;
  if (raw && Array.isArray(raw.paragraphs) && raw.paragraphs.length > 0) {
    const sanitized = sanitizeBioDocument(raw);
    if (sanitized.paragraphs.length > 0 && !hasEmptyClassicShell(sanitized)) {
      if (shouldMigrateStoredClassicBioToPlain(sanitized, hero)) {
        const fields = coerceClassicBioFields(hero);
        return plainBioDocumentFromHeroFields({
          subtitle: fields.subtitle,
          description: fields.description,
        });
      }
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
        runs: [{ type: "text" as const, text: hero.accentText.trim() }],
      });
    }
    return { paragraphs };
  }

  const fields = coerceClassicBioFields(hero);
  const paragraphs: BioParagraph[] = plainBioDocumentFromHeroFields({
    subtitle: fields.subtitle,
    description: fields.description,
  }).paragraphs;
  if (hero.accentText?.trim()) {
    paragraphs.push({
      runs: [{ type: "text" as const, text: hero.accentText.trim() }],
    });
  }
  return { paragraphs };
}
