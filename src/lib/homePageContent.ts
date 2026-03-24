/**
 * Home page CMS payload stored in `profiles.hero_text` and localStorage key `heroText`.
 * v2 wraps hero + stats + UI labels; legacy flat objects are migrated on read.
 */

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
  /** Set on each persist so refresh can prefer newer local draft if Supabase is stale. */
  _clientSavedAt?: number;
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

/** Default strings for classic bio when stored hero fields are blank (prevents empty gradient/bold runs). */
export const DEFAULT_CLASSIC_BIO_FIELDS = {
  subtitle: "Brian Bureson is a (super rad) product design leader and builder,",
  description: "crafting high quality products and teams through",
  word1: "planning",
  word2: "collaboration",
  word3: "empathy",
  word4: "design",
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
): typeof DEFAULT_CLASSIC_BIO_FIELDS {
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
    bioDocument: classicBioDocumentFromHero(fields),
  };
}

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
  return healDegenerateHeroBio(merged);
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

  const ts = obj._clientSavedAt;
  const tsOpt =
    typeof ts === "number" && !Number.isNaN(ts) ? { _clientSavedAt: ts } : {};

  // Nested hero (v2) — include when _version was omitted by older saves
  if (obj.hero && typeof obj.hero === "object") {
    return {
      _version: HOME_PAGE_CONTENT_VERSION,
      hero: mergeHero(obj.hero as Record<string, unknown>),
      stats: mergeStats(obj.stats),
      ui: mergeUI(obj.ui),
      ...tsOpt,
    };
  }

  // Legacy flat: greeting/subtitle/… at root — often had stats/ui added later; do not drop them
  const {
    stats: rawStats,
    ui: rawUi,
    _version: _ignoredVersion,
    _clientSavedAt: _ignoredSavedAt,
    ...heroFlat
  } = obj;

  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: mergeHero(heroFlat as Record<string, unknown>),
    stats: mergeStats(rawStats),
    ui: mergeUI(rawUi),
    ...tsOpt,
  };
}

export function toPersistedPayload(content: HomePageContentV2): HomePagePersisted {
  const ts = content._clientSavedAt;
  return {
    _version: HOME_PAGE_CONTENT_VERSION,
    hero: { ...content.hero },
    stats: content.stats.map((s) => ({ ...s })),
    ui: { ...content.ui },
    ...(typeof ts === "number" && !Number.isNaN(ts) ? { _clientSavedAt: ts } : {}),
  };
}

export function heroHasMinimumContent(hero: HeroTextState): boolean {
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
 * Returns false when there is nothing meaningful to store.
 */
export function persistHomePageToLocalStorageSync(c: HomePageContentV2): boolean {
  if (!shouldPersistHomePageContent(c)) return false;
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return false;
  const payload = toPersistedPayload({ ...c, _clientSavedAt: Date.now() });
  globalThis.localStorage.setItem("heroText", JSON.stringify(payload));
  return true;
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
 * After fetching `profiles.hero_text`, pick what to show.
 * - Signed-out / visitors: never use localStorage — only the published `remote` payload (same as incognito).
 * - Signed in: prefer local when its `_clientSavedAt` beats the remote hero version (editing drafts).
 *   Use `hero_text._clientSavedAt` when set; only if missing, fall back to `profiles.updated_at`.
 */
export function resolveHomeContentAfterLoad(
  rawRemote: unknown,
  authed: boolean,
  options?: ResolveHomeContentOptions,
): ResolveHomeContentResult {
  const remote = parseStoredHomeContent(rawRemote ?? {});
  const local = readHomePageContentFromLocalStorage();
  const profileMs = options?.remoteProfileUpdatedAtMs;
  const remoteProfileAt =
    typeof profileMs === "number" && !Number.isNaN(profileMs) ? profileMs : 0;

  const localValid = Boolean(local && shouldPersistHomePageContent(local));

  if (!authed) {
    // Public / incognito: DB (or empty defaults) only — never blend in localStorage.
    return {
      content: remote,
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
        content: local!,
        localDraftSupersededByCloud: false,
        draftAheadOfPublished: true,
      };
    }
    return {
      content: remote,
      localDraftSupersededByCloud: true,
      draftAheadOfPublished: false,
    };
  }

  return {
    content: remote,
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
    if (sanitized.paragraphs.length > 0 && !hasEmptyClassicShell(sanitized)) {
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

  const fields = coerceClassicBioFields(hero);
  const paragraphs: BioParagraph[] = [classicBioDocumentFromHero(fields).paragraphs[0]];
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
