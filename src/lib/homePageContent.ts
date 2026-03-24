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

/** Default segment strings for initial hero state and legacy migration when building bioDocument. */
export const DEFAULT_CLASSIC_BIO_FIELDS = {
  subtitle: "Brian Bureson is a product design leader and builder who turns complex ideas into high-quality, shipped products. He architects AI-native designs, from high-fidelity vision to production-ready code.", 
  description: "Brian works across product strategy, UX, and engineering to help teams move from ambiguity to execution.",
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

/** Two plain paragraphs (line break between sections); no bold or gradient runs. */
export function plainBioDocumentFromHeroFields(fields: {
  subtitle: string;
  description: string;
}): BioDocument {
  return {
    paragraphs: [
      { runs: [{ type: "text", text: fields.subtitle }] },
      { runs: [{ type: "text", text: fields.description }] },
    ],
  };
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

function mergeUI(raw: unknown): HomePageUI {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<HomePageUI>;
  return {
    ...DEFAULT_UI,
    ...o,
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
    return {
      _version: HOME_PAGE_CONTENT_VERSION,
      hero: mergeHero(heroWithoutStats),
      stats: mergeStats(pickStatsArrayFromStored(obj)),
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
    hero: mergeHeroFromLegacyFlat(heroFlat as Record<string, unknown>),
    stats: mergeStats(
      rawStats !== undefined && rawStats !== null
        ? rawStats
        : pickStatsArrayFromStored(obj),
    ),
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
