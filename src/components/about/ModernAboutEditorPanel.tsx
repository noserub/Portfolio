import { useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  ModernEditorDialog,
  ModernEditorField,
  ModernEditorInlineShell,
  modernEditorInputStyle,
} from "../modern/ModernEditorDialog";
import { modern, modernFont } from "../../design/modernTokens";
import {
  ABOUT_SECTION_LABELS,
  hiddenAboutSections,
  type AboutCertificationItem,
  type AboutEditorDraft,
  type AboutTitleTextItem,
  type AboutToolsCategoryDraft,
} from "../../lib/aboutPageEditorModel";

interface ModernAboutEditorPanelProps {
  open: boolean;
  presentation?: "inline" | "portal";
  loading: boolean;
  draft: AboutEditorDraft | null;
  onPatch: (fn: (prev: AboutEditorDraft) => AboutEditorDraft) => void;
  onCancel: () => void;
  onDone: () => void;
  saving: boolean;
}

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="text-sm font-semibold pt-2 border-t"
      style={{ ...modernFont, borderColor: modern.border }}
    >
      {children}
    </h3>
  );
}

function AboutProcessEditorFields({
  draft,
  onPatch,
}: {
  draft: AboutEditorDraft;
  onPatch: (fn: (prev: AboutEditorDraft) => AboutEditorDraft) => void;
}) {
  return (
    <>
      <SectionHeading id="about-editor-process">How I work</SectionHeading>
      <ModernEditorField label="Section title">
        <Input
          value={draft.processTitle}
          onChange={(e) => onPatch((d) => ({ ...d, processTitle: e.target.value }))}
          className="bg-transparent"
          style={modernEditorInputStyle}
        />
      </ModernEditorField>
      <ModernEditorField label="Subheading">
        <Textarea
          value={draft.processSubheading}
          onChange={(e) => onPatch((d) => ({ ...d, processSubheading: e.target.value }))}
          rows={3}
          className="bg-transparent resize-y min-h-[4rem]"
          style={modernEditorInputStyle}
        />
      </ModernEditorField>
      <div className="space-y-3">
        {draft.processItems.map((step, index) => (
          <div
            key={index}
            className="space-y-2 p-3 rounded-lg border"
            style={{ borderColor: modern.border, background: modern.surfaceInset }}
          >
            <ModernEditorField label="Step label" hint='e.g. "01 · DISCOVER"'>
              <Input
                value={step.num}
                onChange={(e) =>
                  onPatch((d) => {
                    const processItems = [...d.processItems];
                    processItems[index] = { ...processItems[index], num: e.target.value };
                    return { ...d, processItems };
                  })
                }
                placeholder="01 · DISCOVER"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            <ModernEditorField label="Step title" hint='e.g. "Map the mess"'>
              <Input
                value={step.title}
                onChange={(e) =>
                  onPatch((d) => {
                    const processItems = [...d.processItems];
                    processItems[index] = { ...processItems[index], title: e.target.value };
                    return { ...d, processItems };
                  })
                }
                placeholder="Map the mess"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            <ModernEditorField label="Description">
              <Textarea
                value={step.items.join("\n")}
                onChange={(e) =>
                  onPatch((d) => {
                    const processItems = [...d.processItems];
                    processItems[index] = {
                      ...processItems[index],
                      items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    };
                    return { ...d, processItems };
                  })
                }
                placeholder="One short paragraph for this step."
                rows={3}
                className="bg-transparent text-sm"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            <button
              type="button"
              className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
              style={modernFont}
              onClick={() =>
                onPatch((d) => ({
                  ...d,
                  processItems: d.processItems.filter((_, i) => i !== index),
                }))
              }
              disabled={draft.processItems.length <= 1}
            >
              Remove step
            </button>
          </div>
        ))}
        <button
          type="button"
          className="modern-home-hero-editor__btn"
          style={modernFont}
          onClick={() =>
            onPatch((d) => ({
              ...d,
              processItems: [
                ...d.processItems,
                {
                  num: `${String(d.processItems.length + 1).padStart(2, "0")} · STEP`,
                  title: "",
                  items: [],
                },
              ],
            }))
          }
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Add process step
        </button>
      </div>
    </>
  );
}

function TitleTextCardEditor({
  items,
  onChange,
  addLabel,
}: {
  items: AboutTitleTextItem[];
  onChange: (items: AboutTitleTextItem[]) => void;
  addLabel: string;
}) {
  const patchItem = (index: number, patch: Partial<AboutTitleTextItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="space-y-2 p-3 rounded-lg border"
          style={{ borderColor: modern.border, background: modern.surfaceInset }}
        >
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="modern-home-hero-editor__icon-btn"
              disabled={index === 0}
              onClick={() => {
                const next = [...items];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
              aria-label="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="modern-home-hero-editor__icon-btn"
              disabled={index === items.length - 1}
              onClick={() => {
                const next = [...items];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                onChange(next);
              }}
              aria-label="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
              style={modernFont}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          <Input
            value={item.title}
            onChange={(e) => patchItem(index, { title: e.target.value })}
            placeholder="Title"
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
          <Textarea
            value={item.text}
            onChange={(e) => patchItem(index, { text: e.target.value })}
            placeholder="Description"
            rows={3}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </div>
      ))}
      <button
        type="button"
        className="modern-home-hero-editor__btn"
        style={modernFont}
        onClick={() => onChange([...items, { title: "", text: "" }])}
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

export function ModernAboutEditorPanel({
  open,
  presentation = "inline",
  loading,
  draft,
  onPatch,
  onCancel,
  onDone,
  saving,
}: ModernAboutEditorPanelProps) {
  if (!open) return null;

  const body =
    loading || !draft ? (
      <div className="space-y-3" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: modern.surfaceInset }} />
        ))}
      </div>
    ) : (
      <>
        <SectionHeading>Hero</SectionHeading>
        <ModernEditorField label="Headline">
          <Textarea
            value={draft.headline}
            onChange={(e) => onPatch((d) => ({ ...d, headline: e.target.value }))}
            rows={2}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>
        <ModernEditorField label="Lead paragraph">
          <Textarea
            value={draft.heroLead}
            onChange={(e) => onPatch((d) => ({ ...d, heroLead: e.target.value }))}
            rows={4}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>
        <ModernEditorField label="Resume URL" hint="Opens when visitors click View resume.">
          <Input
            value={draft.resumeUrl}
            onChange={(e) => onPatch((d) => ({ ...d, resumeUrl: e.target.value }))}
            placeholder="https://…"
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>

        <SectionHeading>Bio card</SectionHeading>
        <ModernEditorField label="Paragraph 1">
          <Textarea
            value={draft.bioParagraph1}
            onChange={(e) => onPatch((d) => ({ ...d, bioParagraph1: e.target.value }))}
            rows={4}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>
        <ModernEditorField label="Paragraph 2">
          <Textarea
            value={draft.bioParagraph2}
            onChange={(e) => onPatch((d) => ({ ...d, bioParagraph2: e.target.value }))}
            rows={4}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>

        <AboutProcessEditorFields draft={draft} onPatch={onPatch} />

        <SectionHeading>Visible sections</SectionHeading>
        <p className="text-xs" style={{ color: modern.muted }}>
          Reorder sections on the About page, or hide a section without deleting its content.
        </p>
        <div className="space-y-2">
          {(draft?.sectionOrder ?? []).map((id, index) => (
            <div
              key={id}
              className="flex items-center gap-2 p-2 rounded-lg border"
              style={{ borderColor: modern.border, background: modern.surfaceInset }}
            >
              <span className="text-sm flex-1" style={modernFont}>
                {ABOUT_SECTION_LABELS[id] ?? id}
              </span>
              <button
                type="button"
                className="modern-home-hero-editor__icon-btn"
                disabled={index === 0}
                onClick={() =>
                  onPatch((d) => {
                    const order = [...d.sectionOrder];
                    [order[index - 1], order[index]] = [order[index], order[index - 1]];
                    return { ...d, sectionOrder: order };
                  })
                }
                aria-label="Move section up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="modern-home-hero-editor__icon-btn"
                disabled={index === (draft?.sectionOrder.length ?? 0) - 1}
                onClick={() =>
                  onPatch((d) => {
                    const order = [...d.sectionOrder];
                    [order[index], order[index + 1]] = [order[index + 1], order[index]];
                    return { ...d, sectionOrder: order };
                  })
                }
                aria-label="Move section down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="modern-home-hero-editor__btn modern-home-hero-editor__btn--danger text-xs px-2"
                style={modernFont}
                onClick={() =>
                  onPatch((d) => ({
                    ...d,
                    sectionOrder: d.sectionOrder.filter((sectionId) => sectionId !== id),
                  }))
                }
              >
                Hide
              </button>
            </div>
          ))}
        </div>
        {draft && hiddenAboutSections(draft.sectionOrder).length > 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-xs" style={{ color: modern.muted }}>
              Hidden sections (content is kept; click Show to publish again)
            </p>
            <div className="flex flex-wrap gap-2">
              {hiddenAboutSections(draft.sectionOrder).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="modern-home-hero-editor__btn"
                  style={modernFont}
                  onClick={() =>
                    onPatch((d) => ({
                      ...d,
                      sectionOrder: [...d.sectionOrder, id],
                    }))
                  }
                >
                  Show {ABOUT_SECTION_LABELS[id] ?? id}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {(
          [
            ["superPowers", "superPowersTitle", "superPowers", "Leadership strengths", true] as const,
            ["highlights", "highlightsTitle", "highlights", "Highlight cards", false] as const,
            ["leadership", "leadershipTitle", "leadershipItems", "Leadership cards", false] as const,
            ["expertise", "expertiseTitle", "expertiseItems", "Expertise cards", false] as const,
            ["howIUseAI", "howIUseAITitle", "howIUseAIItems", "How I use AI cards", false] as const,
          ] as const
        ).map(([id, titleKey, itemsKey, addLabel, isList]) => (
          <div key={id}>
            <SectionHeading>{ABOUT_SECTION_LABELS[id] ?? id}</SectionHeading>
            <ModernEditorField label="Section title">
              <Input
                value={draft[titleKey]}
                onChange={(e) => onPatch((d) => ({ ...d, [titleKey]: e.target.value }))}
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
            </ModernEditorField>
            {isList ? (
              <ModernEditorField label="Items" hint="One strength per line.">
                <Textarea
                  value={draft.superPowers.join("\n")}
                  onChange={(e) =>
                    onPatch((d) => ({
                      ...d,
                      superPowers: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                  rows={6}
                  className="bg-transparent font-mono text-sm"
                  style={modernEditorInputStyle}
                />
              </ModernEditorField>
            ) : (
              <TitleTextCardEditor
                items={draft[itemsKey] as AboutTitleTextItem[]}
                onChange={(items) => onPatch((d) => ({ ...d, [itemsKey]: items }))}
                addLabel={addLabel}
              />
            )}
          </div>
        ))}

        <SectionHeading>Certifications</SectionHeading>
        <ModernEditorField label="Section title">
          <Input
            value={draft.certificationsTitle}
            onChange={(e) => onPatch((d) => ({ ...d, certificationsTitle: e.target.value }))}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>
        <div className="space-y-3">
          {draft.certificationsItems.map((cert, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-2 p-3 rounded-lg border"
              style={{ borderColor: modern.border, background: modern.surfaceInset }}
            >
              <Input
                value={cert.badge}
                onChange={(e) =>
                  onPatch((d) => {
                    const certificationsItems = [...d.certificationsItems];
                    certificationsItems[index] = { ...certificationsItems[index], badge: e.target.value };
                    return { ...d, certificationsItems };
                  })
                }
                placeholder="Badge"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
              <Input
                value={cert.title}
                onChange={(e) =>
                  onPatch((d) => {
                    const certificationsItems = [...d.certificationsItems];
                    certificationsItems[index] = { ...certificationsItems[index], title: e.target.value };
                    return { ...d, certificationsItems };
                  })
                }
                placeholder="Title"
                className="col-span-2 bg-transparent"
                style={modernEditorInputStyle}
              />
              <Input
                value={cert.org}
                onChange={(e) =>
                  onPatch((d) => {
                    const certificationsItems = [...d.certificationsItems];
                    certificationsItems[index] = { ...certificationsItems[index], org: e.target.value };
                    return { ...d, certificationsItems };
                  })
                }
                placeholder="Organization"
                className="col-span-3 bg-transparent"
                style={modernEditorInputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            className="modern-home-hero-editor__btn"
            style={modernFont}
            onClick={() =>
              onPatch((d) => ({
                ...d,
                certificationsItems: [...d.certificationsItems, { badge: "", title: "", org: "" }],
              }))
            }
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Add certification
          </button>
        </div>

        <SectionHeading>Tools & stack</SectionHeading>
        <ModernEditorField label="Section title">
          <Input
            value={draft.toolsTitle}
            onChange={(e) => onPatch((d) => ({ ...d, toolsTitle: e.target.value }))}
            className="bg-transparent"
            style={modernEditorInputStyle}
          />
        </ModernEditorField>
        <div className="space-y-3">
          {draft.toolsCategories.map((cat, index) => (
            <div
              key={index}
              className="space-y-2 p-3 rounded-lg border"
              style={{ borderColor: modern.border, background: modern.surfaceInset }}
            >
              <Input
                value={cat.title}
                onChange={(e) =>
                  onPatch((d) => {
                    const toolsCategories = [...d.toolsCategories];
                    toolsCategories[index] = { ...toolsCategories[index], title: e.target.value };
                    return { ...d, toolsCategories };
                  })
                }
                placeholder="Category name"
                className="bg-transparent"
                style={modernEditorInputStyle}
              />
              <Textarea
                value={cat.tools.join("\n")}
                onChange={(e) =>
                  onPatch((d) => {
                    const toolsCategories = [...d.toolsCategories];
                    toolsCategories[index] = {
                      ...toolsCategories[index],
                      tools: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    };
                    return { ...d, toolsCategories };
                  })
                }
                placeholder="Tools (one per line)"
                rows={4}
                className="bg-transparent text-sm"
                style={modernEditorInputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            className="modern-home-hero-editor__btn"
            style={modernFont}
            onClick={() =>
              onPatch((d) => ({
                ...d,
                toolsCategories: [...d.toolsCategories, { title: "", tools: [] }],
              }))
            }
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Add tool category
          </button>
        </div>
      </>
    );

  if (presentation === "inline") {
    return (
      <ModernEditorInlineShell
        title="Edit about content"
        onCancel={onCancel}
        onDone={onDone}
        saving={saving}
      >
        {body}
      </ModernEditorInlineShell>
    );
  }

  return (
    <ModernEditorDialog
      open={open}
      title="Edit about content"
      onCancel={onCancel}
      onDone={onDone}
      saving={saving}
    >
      {body}
    </ModernEditorDialog>
  );
}
