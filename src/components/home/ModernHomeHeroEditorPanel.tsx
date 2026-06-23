import {
  Suspense,
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
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
  mergeHeroGreetingsFromDraftLines,
  type CaseStudyFilterEntry,
  type DefaultCaseStudyFilter,
  type HomePageContentV2,
  type HomePageStat,
  type HeroTextState,
} from "../../lib/homePageContent";
import { useModernCaseStudies } from "../../lib/modernCaseStudies";
import { lazyWithRetry } from "../../utils/lazyWithRetry";
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
  ModernEditorShell,
  modernEditorInputStyle,
} from "../modern/ModernEditorDialog";
import { modern, modernFont } from "../../design/modernTokens";

const HomeBioDocumentEditor = lazyWithRetry(() =>
  import("../HomeBioDocumentEditor").then((m) => ({
    default: m.HomeBioDocumentEditor,
  })),
);

interface ModernHomeHeroEditorPanelProps {
  open: boolean;
  onClose: () => void;
  homePageContent: HomePageContentV2;
  setHomePageContent: Dispatch<SetStateAction<HomePageContentV2>>;
  homeContentHydratedRef: MutableRefObject<boolean>;
  persistHomePageNow: (content: HomePageContentV2) => Promise<void>;
  clearDebouncedHeroSave: () => void;
}

export function ModernHomeHeroEditorPanel({
  open,
  onClose,
  homePageContent,
  setHomePageContent,
  homeContentHydratedRef,
  persistHomePageNow,
  clearDebouncedHeroSave,
}: ModernHomeHeroEditorPanelProps) {
  const { projects, loading: projectsLoading } = useProjects();
  const caseStudies = useModernCaseStudies(projects, projectsLoading, true);
  const [bioEditorRevision, setBioEditorRevision] = useState(0);
  const [greetingsTextValue, setGreetingsTextValue] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleCancel = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleDone = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    clearDebouncedHeroSave();

    let merged: HomePageContentV2 | null = null;
    flushSync(() => {
      setHomePageContent((c) => {
        merged = mergeHeroGreetingsFromDraftLines(c, greetingsTextValue);
        return merged;
      });
    });

    try {
      if (merged && homeContentHydratedRef.current) {
        await persistHomePageNow(merged);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    clearDebouncedHeroSave,
    setHomePageContent,
    greetingsTextValue,
    homeContentHydratedRef,
    persistHomePageNow,
    onClose,
  ]);

  const heroText = homePageContent.hero;
  const bioDocumentForUi =
    healDegenerateHeroBio(heroText).bioDocument ?? defaultBioDocument();

  return (
    <ModernEditorShell
      open={open}
      title="Edit home content"
      titleId="modern-home-hero-editor-title"
      onCancel={handleCancel}
      onDone={() => void handleDone()}
      saving={saving}
      bodyRef={scrollRef}
    >
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
                  setBioEditorRevision((n) => n + 1);
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
              Animated headline
            </h3>
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
                value={homePageContent.ui.defaultCaseStudyFilter}
                onValueChange={(v) => patchUi({ defaultCaseStudyFilter: v as DefaultCaseStudyFilter })}
              >
                <SelectTrigger className="bg-transparent" style={modernEditorInputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{homePageContent.ui.filterAll || "All"}</SelectItem>
                  {homePageContent.ui.caseStudyFilters.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModernEditorField>
            <ModernEditorField
              label="Featured case study"
              hint="Wide hero card at the top of the grid. Uses first visible study if this one is hidden by a filter."
            >
              <Select
                value={homePageContent.ui.featuredCaseStudyId ?? "__default__"}
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
    </ModernEditorShell>
  );
}

/** Edit-mode home CMS hook + panel state (single `useHomePageContent` instance). */
export function useModernHomeHeroEditor() {
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [isEditingHero, setIsEditingHero] = useState(false);
  const isEditingHeroRef = useRef(isEditingHero);
  isEditingHeroRef.current = isEditingHero;
  const [bioEditorRevision, setBioEditorRevision] = useState(0);
  const [greetingsTextValue, setGreetingsTextValue] = useState("");
  const greetingsTextValueRef = useRef(greetingsTextValue);
  greetingsTextValueRef.current = greetingsTextValue;

  const bumpBioEditorRevision = useCallback(() => setBioEditorRevision((n) => n + 1), []);

  const cms = useHomePageContent({
    bumpBioEditorRevision,
    isEditingHeroRef,
    greetingsTextValueRef,
    setIsEditingHero,
    isEditingHero,
    greetingsTextValue,
  });

  return {
    heroEditorOpen,
    openHeroEditor: () => setHeroEditorOpen(true),
    closeHeroEditor: () => setHeroEditorOpen(false),
    cms,
  };
}
