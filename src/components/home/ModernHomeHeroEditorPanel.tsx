import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "../../contexts/ProjectsContext";
import { useHomePageContent } from "../../hooks/useHomePageContent";
import {
  CASE_STUDY_FILTER_TYPE_IDS,
  DEFAULT_CASE_STUDY_FILTERS,
  defaultBioDocument,
  healDegenerateHeroBio,
  inferHeroHeadlinePrefixFromGreetings,
  mergeHeroGreetingsFromDraftLines,
  resolveStaticHeroHeadline,
  type CaseStudyFilterEntry,
  type DefaultCaseStudyFilter,
  type HeroHeadlineMode,
  type HomePageContentV2,
  type HomePageStat,
  type HeroTextState,
  mergeLogoStrip,
  mergeLeadershipStrip,
  type HomePageLogoEntry,
  type HomePageLogoStrip,
  type HomePageLeadershipStrip,
} from "../../lib/homePageContent";
import { useModernCaseStudies } from "../../lib/modernCaseStudies";
import { clampLogoImageScale, measureLogoImageScale } from "../../lib/logoImageScale";
import { lazyWithRetry } from "../../utils/lazyWithRetry";
import { uploadLogoImage } from "../../utils/imageHelpers";
import { resolveLogoImageUrl, validateLogoImageUrl } from "../../utils/imageOptimizer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import {
  ModernEditorField,
  ModernEditorInlineShell,
  ModernEditorShell,
  modernEditorInputStyle,
} from "../modern/ModernEditorDialog";
import { modern, modernFont } from "../../design/modernTokens";

const HomeBioDocumentEditor = lazyWithRetry(() =>
  import("../HomeBioDocumentEditor").then((m) => ({
    default: m.HomeBioDocumentEditor,
  })),
);

function LogoUrlPreview({
  url,
  name,
  imageScale = 1,
}: {
  url: string;
  name: string;
  imageScale?: number;
}) {
  const validation = useMemo(() => validateLogoImageUrl(url), [url]);
  const resolved = validation.resolved;
  const scale = clampLogoImageScale(imageScale);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved, scale]);

  if (!validation.ok && validation.message) {
    return (
      <p className="text-xs rounded-md border px-3 py-2" style={{ borderColor: modern.border, color: modern.muted }}>
        {validation.message}
      </p>
    );
  }

  if (failed) {
    return (
      <p className="text-xs rounded-md border px-3 py-2" style={{ borderColor: modern.border, color: modern.muted }}>
        Could not load this image. The site may block hotlinking — try Upload logo, or use a direct .png / .svg URL.
      </p>
    );
  }

  if (!resolved) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2" style={{ borderColor: modern.border }}>
      <span
        className="modern-logo-strip__slot"
        style={{ flexShrink: 0, ["--logo-scale" as string]: String(scale) }}
      >
        <img
          src={resolved}
          alt={`${name} logo preview`}
          className="modern-logo-strip__img"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
      <span className="text-xs truncate" style={{ color: modern.muted }}>
        Preview (matches homepage size)
      </span>
    </div>
  );
}

interface ModernHomeHeroEditorPanelProps {
  open: boolean;
  onClose: () => void;
  homePageContent: HomePageContentV2;
  setHomePageContent: Dispatch<SetStateAction<HomePageContentV2>>;
  persistHomePageNow: (content: HomePageContentV2) => Promise<boolean>;
  clearDebouncedHeroSave: () => void;
  bioEditorRevision: number;
  onBumpBioRevision: () => void;
  /** `inline` renders in the hero (no portal). `portal` uses the slide-over shell. */
  presentation?: "inline" | "portal";
}

export function ModernHomeHeroEditorPanel({
  open,
  onClose,
  homePageContent,
  setHomePageContent,
  persistHomePageNow,
  clearDebouncedHeroSave,
  bioEditorRevision,
  onBumpBioRevision,
  presentation = "portal",
}: ModernHomeHeroEditorPanelProps) {
  const { projects, loading: projectsLoading } = useProjects();
  const caseStudies = useModernCaseStudies(projects, projectsLoading, true);
  const [greetingsTextValue, setGreetingsTextValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [logoUploadIndex, setLogoUploadIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const homePageContentRef = useRef(homePageContent);
  homePageContentRef.current = homePageContent;

  const patchUi = useCallback(
    (patch: Partial<HomePageContentV2["ui"]>) => {
      setHomePageContent((c) => ({ ...c, ui: { ...c.ui, ...patch } }));
    },
    [setHomePageContent],
  );

  const addCaseStudyFilter = useCallback(() => {
    const used = new Set(homePageContent.ui.caseStudyFilters.map((f) => f.id));
    const nextId = CASE_STUDY_FILTER_TYPE_IDS.find((id) => !used.has(id));
    if (!nextId) {
      toast.info("All category types are already in the list.");
      return;
    }
    const defaultLabel = DEFAULT_CASE_STUDY_FILTERS.find((f) => f.id === nextId)?.label ?? nextId;
    patchUi({
      caseStudyFilters: [...homePageContent.ui.caseStudyFilters, { id: nextId, label: defaultLabel }],
    });
  }, [homePageContent.ui.caseStudyFilters, patchUi]);

  const updateCaseStudyFilter = useCallback(
    (index: number, patch: Partial<CaseStudyFilterEntry>) => {
      const row = homePageContent.ui.caseStudyFilters[index];
      if (!row) return;
      const next = [...homePageContent.ui.caseStudyFilters];
      const merged = { ...row, ...patch } as CaseStudyFilterEntry;
      if (patch.id && patch.id !== row.id) {
        const duplicate = next.some((f, i) => i !== index && f.id === patch.id);
        if (duplicate) {
          toast.error("That category is already in the filter list.");
          return;
        }
      }
      next[index] = merged;
      patchUi({ caseStudyFilters: next });
    },
    [homePageContent.ui.caseStudyFilters, patchUi],
  );

  const removeCaseStudyFilter = useCallback(
    (index: number) => {
      const row = homePageContent.ui.caseStudyFilters[index];
      const nextFilters = homePageContent.ui.caseStudyFilters.filter((_, i) => i !== index);
      const patch: Partial<HomePageContentV2["ui"]> = { caseStudyFilters: nextFilters };
      if (row && homePageContent.ui.defaultCaseStudyFilter === row.id) {
        patch.defaultCaseStudyFilter = "all";
      }
      patchUi(patch);
    },
    [homePageContent.ui.caseStudyFilters, homePageContent.ui.defaultCaseStudyFilter, patchUi],
  );

  const moveCaseStudyFilter = useCallback(
    (index: number, dir: -1 | 1) => {
      const list = homePageContent.ui.caseStudyFilters;
      const j = index + dir;
      if (j < 0 || j >= list.length) return;
      const next = [...list];
      [next[index], next[j]] = [next[j], next[index]];
      patchUi({ caseStudyFilters: next });
    },
    [homePageContent.ui.caseStudyFilters, patchUi],
  );

  const patchHero = useCallback(
    (patch: Partial<HeroTextState>) => {
      setHomePageContent((c) => ({ ...c, hero: { ...c.hero, ...patch } }));
    },
    [setHomePageContent],
  );

  const patchStat = useCallback(
    (index: number, patch: Partial<HomePageStat>) => {
      setHomePageContent((c) => {
        const stats = [...c.stats];
        stats[index] = { ...stats[index], ...patch };
        return { ...c, stats };
      });
    },
    [setHomePageContent],
  );

  const moveStat = useCallback(
    (index: number, dir: -1 | 1) => {
      setHomePageContent((c) => {
        const j = index + dir;
        if (j < 0 || j >= c.stats.length) return c;
        const stats = [...c.stats];
        [stats[index], stats[j]] = [stats[j], stats[index]];
        return { ...c, stats };
      });
    },
    [setHomePageContent],
  );

  const addStat = useCallback(() => {
    setHomePageContent((c) => ({
      ...c,
      stats: [...c.stats, { number: "0", label: "New stat", description: "Description" }],
    }));
  }, [setHomePageContent]);

  const removeStat = useCallback(
    (index: number) => {
      setHomePageContent((c) => {
        if (c.stats.length <= 1) return c;
        return { ...c, stats: c.stats.filter((_, i) => i !== index) };
      });
    },
    [setHomePageContent],
  );

  const logoStrip = homePageContent.logoStrip ?? mergeLogoStrip(undefined);
  const leadershipStrip = homePageContent.leadershipStrip ?? mergeLeadershipStrip(undefined);

  const patchLogoStrip = useCallback(
    (patch: Partial<HomePageLogoStrip>) => {
      setHomePageContent((c) => ({
        ...c,
        logoStrip: { ...(c.logoStrip ?? mergeLogoStrip(undefined)), ...patch },
      }));
    },
    [setHomePageContent],
  );

  const patchLogoEntry = useCallback(
    (index: number, patch: Partial<HomePageLogoEntry>) => {
      setHomePageContent((c) => {
        const strip = c.logoStrip ?? mergeLogoStrip(undefined);
        const entries = [...strip.entries];
        entries[index] = { ...entries[index], ...patch };
        return { ...c, logoStrip: { ...strip, entries } };
      });
    },
    [setHomePageContent],
  );

  const addLogoEntry = useCallback(() => {
    setHomePageContent((c) => {
      const strip = c.logoStrip ?? mergeLogoStrip(undefined);
      return {
        ...c,
        logoStrip: { ...strip, entries: [...strip.entries, { name: "Company" }] },
      };
    });
  }, [setHomePageContent]);

  const removeLogoEntry = useCallback(
    (index: number) => {
      setHomePageContent((c) => {
        const strip = c.logoStrip ?? mergeLogoStrip(undefined);
        if (strip.entries.length <= 1) return c;
        return {
          ...c,
          logoStrip: { ...strip, entries: strip.entries.filter((_, i) => i !== index) },
        };
      });
    },
    [setHomePageContent],
  );

  const handleLogoFileUpload = useCallback(
    async (index: number, file: File | undefined) => {
      if (!file) return;
      setLogoUploadIndex(index);
      try {
        const publicUrl = await uploadLogoImage(file);
        const scale = await measureLogoImageScale(publicUrl);
        patchLogoEntry(index, { imageUrl: publicUrl, imageScale: scale });
        if (scale > 1.02) {
          toast.message("Logo uploaded. Display size adjusted for extra padding in the file.");
        } else {
          toast.success("Logo uploaded.");
        }
        requestAnimationFrame(() => {
          scrollRef.current
            ?.querySelector(`[data-logo-entry="${index}"]`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Logo upload failed.";
        toast.error(message);
      } finally {
        setLogoUploadIndex(null);
      }
    },
    [patchLogoEntry],
  );

  const autoAdjustLogoScale = useCallback(
    async (index: number, url: string, companyName: string) => {
      const scale = await measureLogoImageScale(url);
      if (scale > 1.02) {
        patchLogoEntry(index, { imageScale: scale });
        toast.message(
          `Adjusted ${companyName || "logo"} display size (${Math.round(scale * 100)}%) for padded artwork.`,
          { duration: 5000 },
        );
      }
    },
    [patchLogoEntry],
  );

  const patchLeadershipStrip = useCallback(
    (patch: Partial<HomePageLeadershipStrip>) => {
      setHomePageContent((c) => ({
        ...c,
        leadershipStrip: { ...(c.leadershipStrip ?? mergeLeadershipStrip(undefined)), ...patch },
      }));
    },
    [setHomePageContent],
  );

  const patchLeadershipBullet = useCallback(
    (index: number, text: string) => {
      setHomePageContent((c) => {
        const strip = c.leadershipStrip ?? mergeLeadershipStrip(undefined);
        const bullets = [...strip.bullets];
        bullets[index] = text;
        return { ...c, leadershipStrip: { ...strip, bullets } };
      });
    },
    [setHomePageContent],
  );

  const addLeadershipBullet = useCallback(() => {
    setHomePageContent((c) => {
      const strip = c.leadershipStrip ?? mergeLeadershipStrip(undefined);
      return {
        ...c,
        leadershipStrip: { ...strip, bullets: [...strip.bullets, "New leadership proof point"] },
      };
    });
  }, [setHomePageContent]);

  const removeLeadershipBullet = useCallback(
    (index: number) => {
      setHomePageContent((c) => {
        const strip = c.leadershipStrip ?? mergeLeadershipStrip(undefined);
        if (strip.bullets.length <= 1) return c;
        return {
          ...c,
          leadershipStrip: { ...strip, bullets: strip.bullets.filter((_, i) => i !== index) },
        };
      });
    },
    [setHomePageContent],
  );

  const handleCancel = useCallback(() => {
    clearDebouncedHeroSave();
    setSaveStatus(null);
    onClose();
  }, [clearDebouncedHeroSave, onClose]);

  const handleDone = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus("Saving…");
    clearDebouncedHeroSave();

    const merged = mergeHeroGreetingsFromDraftLines(
      homePageContentRef.current,
      greetingsTextValue,
    );

    try {
      flushSync(() => {
        setHomePageContent(merged);
      });

      const ok = await persistHomePageNow(merged);
      if (ok) {
        setSaveStatus("Saved.");
        toast.success("Home content saved.");
        onClose();
        return;
      }
      setSaveStatus("Save failed. See message above or try again.");
    } catch (error) {
      console.error("Home content save error:", error);
      const message =
        error instanceof Error ? error.message : "Unexpected error while saving home content.";
      setSaveStatus(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    clearDebouncedHeroSave,
    setHomePageContent,
    greetingsTextValue,
    persistHomePageNow,
    onClose,
  ]);

  const heroText = homePageContent.hero;
  const bioDocumentForUi =
    healDegenerateHeroBio(heroText).bioDocument ?? defaultBioDocument();
  const headlineMode: HeroHeadlineMode =
    heroText.heroHeadlineMode === "static" ? "static" : "animated";
  const staticHeadlinePreview = resolveStaticHeroHeadline(heroText);

  const setHeadlineMode = useCallback(
    (mode: HeroHeadlineMode) => {
      if (mode === "static") {
        const inferredPrefix = inferHeroHeadlinePrefixFromGreetings(heroText);
        const resolved = resolveStaticHeroHeadline(heroText);
        patchHero({
          heroHeadlineMode: "static",
          heroHeadlinePrefix: heroText.heroHeadlinePrefix?.trim() || inferredPrefix || resolved.prefix,
          heroHeadlineMain: heroText.heroHeadlineMain?.trim() || resolved.main,
        });
        return;
      }
      patchHero({ heroHeadlineMode: "animated" });
    },
    [heroText, patchHero],
  );

  const defaultFilterSelectValue = useMemo(() => {
    const df = homePageContent.ui.defaultCaseStudyFilter;
    if (df === "all") return "__all__";
    if (CASE_STUDY_FILTER_TYPE_IDS.includes(df as (typeof CASE_STUDY_FILTER_TYPE_IDS)[number])) {
      return df;
    }
    return "__all__";
  }, [homePageContent.ui.defaultCaseStudyFilter]);

  const featuredSelectValue = useMemo(() => {
    const id = homePageContent.ui.featuredCaseStudyId;
    if (!id) return "__default__";
    if (caseStudies.some((p) => p.id === id)) return id;
    return "__default__";
  }, [homePageContent.ui.featuredCaseStudyId, caseStudies]);

  if (!open) return null;

  const editorBody = (
    <>
          {saveStatus ? (
            <p
              className="text-sm rounded-md px-3 py-2 border"
              role="status"
              style={{
                ...modernFont,
                color: saveStatus.startsWith("Saved") ? modern.accent : modern.text,
                borderColor: modern.border,
                background: modern.surfaceInset,
              }}
            >
              {saveStatus}
            </p>
          ) : null}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold" style={modernFont}>
              Intro copy
            </h3>
            <Suspense
              fallback={
                <div className="min-h-[10rem] rounded-lg animate-pulse" style={{ background: modern.surfaceInset }} />
              }
            >
              <HomeBioDocumentEditor
                document={bioDocumentForUi}
                contentRevision={bioEditorRevision}
                onChange={(doc) => patchHero({ bioDocument: doc })}
                paragraphGapRem={heroText.bioParagraphGapRem ?? 0.75}
                lineHeight={heroText.bioLineHeight ?? 1.65}
                onParagraphGapRem={(v) => patchHero({ bioParagraphGapRem: v })}
                onLineHeight={(v) => patchHero({ bioLineHeight: v })}
                onReplaceFromTemplate={() => {
                  patchHero({ bioDocument: defaultBioDocument() });
                  onBumpBioRevision();
                }}
              />
            </Suspense>
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <h3 className="text-sm font-semibold" style={modernFont}>
              Hero buttons
            </h3>
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: modern.muted }}>
                Primary button (About)
              </Label>
              <Input
                value={heroText.buttonText}
                onChange={(e) => patchHero({ buttonText: e.target.value })}
                placeholder="About Brian"
                className="bg-transparent"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: modern.muted }}>
                Secondary button (Contact)
              </Label>
              <Input
                value={homePageContent.ui.contactCtaLabel}
                onChange={(e) => patchUi({ contactCtaLabel: e.target.value })}
                placeholder="Get in touch"
                className="bg-transparent"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <h3 className="text-sm font-semibold" style={modernFont}>
              Headline
            </h3>
            <div
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
              style={{ borderColor: modern.border }}
            >
              <div>
                <Label htmlFor="modern-hero-headline-static" className="text-sm" style={modernFont}>
                  Static headline
                </Label>
                <p className="text-xs mt-0.5" style={{ color: modern.muted }}>
                  Fixed two-line headline. Turn off for animated typewriter.
                </p>
              </div>
              <Switch
                id="modern-hero-headline-static"
                checked={headlineMode === "static"}
                onCheckedChange={(checked) => setHeadlineMode(checked ? "static" : "animated")}
              />
            </div>

            {headlineMode === "static" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: modern.muted }}>
                    Line 1 (smaller, muted)
                  </Label>
                  <Input
                    value={heroText.heroHeadlinePrefix ?? staticHeadlinePreview.prefix}
                    onChange={(e) => patchHero({ heroHeadlinePrefix: e.target.value })}
                    placeholder="AI Product"
                    className="bg-transparent"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: modern.muted }}>
                    Line 2 (large accent)
                  </Label>
                  <Input
                    value={heroText.heroHeadlineMain ?? staticHeadlinePreview.main}
                    onChange={(e) => patchHero({ heroHeadlineMain: e.target.value })}
                    placeholder="Design Leader"
                    className="bg-transparent"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Label className="text-xs" style={{ color: modern.muted }}>
                  One greeting per line
                </Label>
                <Textarea
                  value={greetingsTextValue}
                  onChange={(e) => setGreetingsTextValue(e.target.value)}
                  onFocus={() => {
                    setGreetingsTextValue((heroText.greetings || [heroText.greeting]).join("\n"));
                  }}
                  onBlur={() => {
                    const greetings = greetingsTextValue
                      ?.split("\n")
                      .map((g) => g.trim())
                      .filter(Boolean);
                    if (greetings.length > 0) {
                      patchHero({ greetings, greeting: greetings[0] });
                    }
                  }}
                  rows={5}
                  className="font-mono text-sm bg-transparent"
                  style={{ borderColor: modern.border, color: modern.text }}
                />
                <div
                  className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
                  style={{ borderColor: modern.border }}
                >
                  <div>
                    <Label htmlFor="modern-hero-retype-suffix" className="text-sm" style={modernFont}>
                      Retype only last word
                    </Label>
                    <p className="text-xs mt-0.5" style={{ color: modern.muted }}>
                      Keeps the first line fixed; only the last word cycles on line two.
                    </p>
                  </div>
                  <Switch
                    id="modern-hero-retype-suffix"
                    checked={heroText.heroRetypeMode === "suffix-only"}
                    onCheckedChange={(checked) =>
                      patchHero({ heroRetypeMode: checked ? "suffix-only" : "full" })
                    }
                  />
                </div>
              </>
            )}
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={modernFont}>
                Quick stats
              </h3>
              <button
                type="button"
                className="modern-home-hero-editor__btn"
                style={modernFont}
                onClick={addStat}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add
              </button>
            </div>
            {homePageContent.stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-3 rounded-lg border"
                style={{ borderColor: modern.border, background: modern.surfaceInset }}
              >
                <div className="flex gap-1 justify-end">
                  <button
                    type="button"
                    className="modern-home-hero-editor__icon-btn"
                    onClick={() => moveStat(index, -1)}
                    disabled={index === 0}
                    aria-label="Move stat up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="modern-home-hero-editor__icon-btn"
                    onClick={() => moveStat(index, 1)}
                    disabled={index === homePageContent.stats.length - 1}
                    aria-label="Move stat down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
                    style={modernFont}
                    onClick={() => removeStat(index)}
                    disabled={homePageContent.stats.length <= 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={stat.number}
                    onChange={(e) => patchStat(index, { number: e.target.value })}
                    placeholder="#"
                    className="bg-transparent"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                  <Input
                    className="col-span-2 bg-transparent"
                    value={stat.label}
                    onChange={(e) => patchStat(index, { label: e.target.value })}
                    placeholder="Label"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                </div>
                <Input
                  value={stat.description}
                  onChange={(e) => patchStat(index, { description: e.target.value })}
                  placeholder="Description"
                  className="bg-transparent"
                  style={{ borderColor: modern.border, color: modern.text }}
                />
              </div>
            ))}
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={modernFont}>
                Logo strip
              </h3>
              <Switch
                checked={logoStrip.enabled}
                onCheckedChange={(checked) => patchLogoStrip({ enabled: checked })}
                aria-label="Show logo strip"
              />
            </div>
            <ModernEditorField
              label="Label (optional)"
              hint="Paste a direct image URL (.png, .svg). On pngwing or similar sites: right-click the image → Copy image address — do not copy the page URL from the address bar."
            >
              <Input
                value={logoStrip.label ?? ""}
                onChange={(e) => patchLogoStrip({ label: e.target.value })}
                placeholder="Previously at"
                className="bg-transparent"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </ModernEditorField>
            <div className="flex justify-end">
              <button
                type="button"
                className="modern-home-hero-editor__btn"
                style={modernFont}
                onClick={addLogoEntry}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add employer
              </button>
            </div>
            {logoStrip.entries.map((entry, index) => (
              <div
                key={index}
                data-logo-entry={index}
                className="flex flex-col gap-2 p-3 rounded-lg border"
                style={{ borderColor: modern.border, background: modern.surfaceInset }}
              >
                <div className="flex gap-2">
                  <Input
                    value={entry.name}
                    onChange={(e) => patchLogoEntry(index, { name: e.target.value })}
                    placeholder="Company name"
                    className="bg-transparent flex-1"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                  <button
                    type="button"
                    className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
                    style={modernFont}
                    onClick={() => removeLogoEntry(index)}
                    disabled={logoStrip.entries.length <= 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={entry.imageUrl ?? ""}
                    onChange={(e) =>
                      patchLogoEntry(index, {
                        imageUrl: e.target.value.trim() ? e.target.value : null,
                      })
                    }
                    onBlur={(e) => {
                      const validation = validateLogoImageUrl(e.target.value);
                      patchLogoEntry(index, { imageUrl: validation.resolved });
                      if (e.target.value.trim() && !validation.ok && validation.message) {
                        toast.error(validation.message, { duration: 8000 });
                      } else if (validation.ok && validation.resolved) {
                        void autoAdjustLogoScale(index, validation.resolved, entry.name);
                      }
                    }}
                    placeholder="https://example.com/logo.png"
                    className="bg-transparent flex-1 min-w-0"
                    style={{ borderColor: modern.border, color: modern.text }}
                  />
                  <label
                    className="modern-home-hero-editor__btn shrink-0 cursor-pointer"
                    style={modernFont}
                  >
                    {logoUploadIndex === index ? "Uploading…" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      disabled={logoUploadIndex !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void handleLogoFileUpload(index, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {entry.imageUrl ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-xs font-medium"
                        style={{ ...modernFont, color: modern.muted }}
                        htmlFor={`logo-scale-${index}`}
                      >
                        Display size ({Math.round(clampLogoImageScale(entry.imageScale) * 100)}%)
                      </label>
                      <input
                        id={`logo-scale-${index}`}
                        type="range"
                        min={60}
                        max={180}
                        step={5}
                        value={Math.round(clampLogoImageScale(entry.imageScale) * 100)}
                        onChange={(e) =>
                          patchLogoEntry(index, { imageScale: Number(e.target.value) / 100 })
                        }
                        className="w-full accent-[var(--modern-accent)]"
                      />
                      <p className="text-xs" style={{ color: modern.muted }}>
                        Use this if a logo looks too small (common with extra transparent padding in the PNG).
                      </p>
                    </div>
                    <LogoUrlPreview
                      url={entry.imageUrl}
                      name={entry.name}
                      imageScale={entry.imageScale}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={modernFont}>
                Leadership strip
              </h3>
              <Switch
                checked={leadershipStrip.enabled}
                onCheckedChange={(checked) => patchLeadershipStrip({ enabled: checked })}
                aria-label="Show leadership strip"
              />
            </div>
            <ModernEditorField label="Eyebrow label (optional)">
              <Input
                value={leadershipStrip.label ?? ""}
                onChange={(e) => patchLeadershipStrip({ label: e.target.value })}
                placeholder="How I lead"
                className="bg-transparent"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </ModernEditorField>
            <ModernEditorField label="Headline">
              <Input
                value={leadershipStrip.headline}
                onChange={(e) => patchLeadershipStrip({ headline: e.target.value })}
                className="bg-transparent"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </ModernEditorField>
            <ModernEditorField label="Subhead (optional)">
              <Textarea
                value={leadershipStrip.subhead ?? ""}
                onChange={(e) => patchLeadershipStrip({ subhead: e.target.value })}
                rows={4}
                className="bg-transparent resize-y min-h-[5rem]"
                style={{ borderColor: modern.border, color: modern.text }}
              />
            </ModernEditorField>
            <div className="flex justify-end">
              <button
                type="button"
                className="modern-home-hero-editor__btn"
                style={modernFont}
                onClick={addLeadershipBullet}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add bullet
              </button>
            </div>
            {leadershipStrip.bullets.map((bullet, index) => (
              <div
                key={index}
                className="flex gap-2 p-3 rounded-lg border"
                style={{ borderColor: modern.border, background: modern.surfaceInset }}
              >
                <Textarea
                  value={bullet}
                  onChange={(e) => patchLeadershipBullet(index, e.target.value)}
                  rows={2}
                  className="bg-transparent resize-y min-h-[3rem] flex-1"
                  style={{ borderColor: modern.border, color: modern.text }}
                />
                <button
                  type="button"
                  className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2 self-start"
                  style={modernFont}
                  onClick={() => removeLeadershipBullet(index)}
                  disabled={leadershipStrip.bullets.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </section>

          <section className="space-y-3 pt-2 border-t" style={{ borderColor: modern.border }}>
            <h3 className="text-sm font-semibold" style={modernFont}>
              Case studies & filters
            </h3>
            <ModernEditorField label="Section heading">
              <Input
                value={homePageContent.ui.caseStudiesTitle}
                onChange={(e) => patchUi({ caseStudiesTitle: e.target.value })}
                placeholder="Case studies"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            <ModernEditorField label="“All” filter label">
              <Input
                value={homePageContent.ui.filterAll}
                onChange={(e) => patchUi({ filterAll: e.target.value })}
                placeholder="All"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            <ModernEditorField
              label="Default filter on load"
              hint="Which chip is selected when visitors first land on the home page."
            >
              <Select
                value={defaultFilterSelectValue}
                onValueChange={(v) =>
                  patchUi({
                    defaultCaseStudyFilter:
                      v === "__all__" ? "all" : (v as DefaultCaseStudyFilter),
                  })
                }
              >
                <SelectTrigger className="bg-transparent" style={modernEditorInputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{homePageContent.ui.filterAll || "All"}</SelectItem>
                  {CASE_STUDY_FILTER_TYPE_IDS.map((id) => {
                    const configured = homePageContent.ui.caseStudyFilters.find((f) => f.id === id);
                    const label =
                      configured?.label ??
                      DEFAULT_CASE_STUDY_FILTERS.find((f) => f.id === id)?.label ??
                      id;
                    return (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </ModernEditorField>
            <ModernEditorField
              label="Featured case study"
              hint="Wide hero card at the top of the grid. Uses first visible study if this one is hidden by a filter."
            >
              <Select
                value={featuredSelectValue}
                onValueChange={(v) =>
                  patchUi({ featuredCaseStudyId: v === "__default__" ? null : v })
                }
              >
                <SelectTrigger className="bg-transparent" style={modernEditorInputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">First in sort order</SelectItem>
                  {caseStudies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                      {!p.published ? " (draft)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModernEditorField>
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: modern.muted }}>
                Category filters
              </Label>
              <p className="text-xs" style={{ color: modern.muted }}>
                Add, remove, reorder, and rename filter chips. A chip only appears on the live site when
                you have published projects in that category.
              </p>
              {homePageContent.ui.caseStudyFilters.map((f, index) => (
                <div
                  key={`${f.id}-${index}`}
                  className="flex flex-col gap-2 p-3 rounded-lg border"
                  style={{ borderColor: modern.border, background: modern.surfaceInset }}
                >
                  <div className="flex flex-wrap gap-2">
                    <div className="w-[10rem] min-w-0">
                      <Label className="text-[10px] mb-1 block" style={{ color: modern.muted }}>
                        Category
                      </Label>
                      <Select
                        value={f.id}
                        onValueChange={(v) => {
                          const id = v as CaseStudyFilterEntry["id"];
                          const defaultLabel =
                            DEFAULT_CASE_STUDY_FILTERS.find((d) => d.id === id)?.label ?? id;
                          updateCaseStudyFilter(index, { id, label: defaultLabel });
                        }}
                      >
                        <SelectTrigger className="bg-transparent h-9" style={modernEditorInputStyle}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CASE_STUDY_FILTER_TYPE_IDS.map((id) => (
                            <SelectItem key={id} value={id}>
                              {DEFAULT_CASE_STUDY_FILTERS.find((d) => d.id === id)?.label ?? id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[8rem]">
                      <Label className="text-[10px] mb-1 block" style={{ color: modern.muted }}>
                        Chip label
                      </Label>
                      <Input
                        value={f.label}
                        onChange={(e) => updateCaseStudyFilter(index, { label: e.target.value })}
                        placeholder="Button text"
                        className="bg-transparent"
                        style={modernEditorInputStyle}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="modern-home-hero-editor__icon-btn"
                      onClick={() => moveCaseStudyFilter(index, -1)}
                      disabled={index === 0}
                      aria-label="Move filter up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="modern-home-hero-editor__icon-btn"
                      onClick={() => moveCaseStudyFilter(index, 1)}
                      disabled={index === homePageContent.ui.caseStudyFilters.length - 1}
                      aria-label="Move filter down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
                      style={modernFont}
                      onClick={() => removeCaseStudyFilter(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="modern-home-hero-editor__btn"
                style={modernFont}
                onClick={addCaseStudyFilter}
                disabled={homePageContent.ui.caseStudyFilters.length >= CASE_STUDY_FILTER_TYPE_IDS.length}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add category filter
              </button>
            </div>
          </section>
    </>
  );

  if (presentation === "inline") {
    return (
      <ModernEditorInlineShell
        title="Edit home content"
        titleId="modern-home-hero-editor-title"
        onCancel={handleCancel}
        onDone={() => void handleDone()}
        saving={saving}
        bodyRef={scrollRef}
      >
        {editorBody}
      </ModernEditorInlineShell>
    );
  }

  return (
    <ModernEditorShell
      open
      title="Edit home content"
      titleId="modern-home-hero-editor-title"
      onCancel={handleCancel}
      onDone={() => void handleDone()}
      saving={saving}
      backdropSaves={false}
      bodyRef={scrollRef}
    >
      {editorBody}
    </ModernEditorShell>
  );
}
