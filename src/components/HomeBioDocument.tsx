import React from "react";
import { motion } from "motion/react";
import type { BioDocument, BioParagraph, BioRun } from "../lib/homePageContent";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2 } from "lucide-react";

function gradientStops(delayIndex: number) {
  const sets = [
    [
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
    ],
    [
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
    ],
    [
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
    ],
    [
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
    ],
  ] as const;
  const set = sets[delayIndex % sets.length];
  return [...set];
}

export interface BioDocumentRendererProps {
  document: BioDocument;
  paragraphGapRem?: number;
  lineHeight?: number;
  className?: string;
}

export function BioDocumentRenderer({
  document,
  paragraphGapRem = 1,
  lineHeight = 1.625,
  className = "",
}: BioDocumentRendererProps) {
  let gradientRunIndex = 0;

  const renderRun = (run: BioRun, pIndex: number, rIndex: number) => {
    const key = `p${pIndex}-r${rIndex}-${run.type}`;
    if (!run.text && run.type !== "text") return null;

    if (run.type === "text" && !run.text) {
      return null;
    }

    if (run.type === "bold") {
      return (
        <strong key={key} className="font-bold">
          {run.text}
        </strong>
      );
    }

    if (run.type === "gradient") {
      const idx = gradientRunIndex++;
      return (
        <motion.span
          key={key}
          className="inline-block"
          animate={{
            backgroundImage: gradientStops(idx),
          }}
          transition={{
            duration: 10 + (idx % 4),
            repeat: Infinity,
            ease: "linear",
            delay: idx * 2.5,
          }}
          style={{
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {run.text}
        </motion.span>
      );
    }

    return (
      <span key={key} className="inline">
        {run.text}
      </span>
    );
  };

  const paragraphs = document.paragraphs?.length
    ? document.paragraphs
    : [{ runs: [{ type: "text" as const, text: "" }] }];

  return (
    <div
      className={`text-lg md:text-xl text-foreground mb-6 pr-8 md:pr-12 lg:pr-16 ${className}`}
    >
      <div className="flex flex-col" style={{ gap: `${paragraphGapRem}rem` }}>
        {paragraphs.map((para: BioParagraph, pIndex: number) => (
          <p
            key={pIndex}
            className="leading-relaxed break-words"
            style={{ lineHeight }}
          >
            {para.runs?.map((run, rIndex) => renderRun(run, pIndex, rIndex))}
          </p>
        ))}
      </div>
    </div>
  );
}

function cloneDoc(doc: BioDocument): BioDocument {
  return {
    paragraphs: doc.paragraphs.map((p) => ({
      runs: p.runs.map((r) => ({ ...r })),
    })),
  };
}

export interface HomeBioDocumentEditorProps {
  document: BioDocument;
  onChange: (doc: BioDocument) => void;
  paragraphGapRem: number;
  lineHeight: number;
  onParagraphGapRem: (v: number) => void;
  onLineHeight: (v: number) => void;
  onReplaceFromTemplate: () => void;
}

export function HomeBioDocumentEditor({
  document,
  onChange,
  paragraphGapRem,
  lineHeight,
  onParagraphGapRem,
  onLineHeight,
  onReplaceFromTemplate,
}: HomeBioDocumentEditorProps) {
  const paragraphs = document.paragraphs?.length
    ? document.paragraphs
    : [{ runs: [{ type: "text" as const, text: "" }] }];

  const update = (next: BioDocument) => {
    onChange(cloneDoc(next));
  };

  const patchParagraph = (pi: number, para: BioParagraph) => {
    const next = cloneDoc({ paragraphs });
    next.paragraphs[pi] = para;
    update(next);
  };

  const patchRun = (pi: number, ri: number, run: BioRun) => {
    const next = cloneDoc({ paragraphs });
    next.paragraphs[pi].runs[ri] = run;
    update(next);
  };

  const addRun = (pi: number) => {
    const next = cloneDoc({ paragraphs });
    next.paragraphs[pi].runs.push({ type: "text", text: "" });
    update(next);
  };

  const removeRun = (pi: number, ri: number) => {
    const next = cloneDoc({ paragraphs });
    if (next.paragraphs[pi].runs.length <= 1) return;
    next.paragraphs[pi].runs.splice(ri, 1);
    update(next);
  };

  const addParagraph = () => {
    const next = cloneDoc({ paragraphs });
    next.paragraphs.push({ runs: [{ type: "text", text: "" }] });
    update(next);
  };

  const removeParagraph = (pi: number) => {
    if (paragraphs.length <= 1) return;
    const next = cloneDoc({ paragraphs });
    next.paragraphs.splice(pi, 1);
    update(next);
  };

  return (
    <div className="space-y-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Bio</h4>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReplaceFromTemplate}>
            Replace from template
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addParagraph}>
            <Plus className="w-3 h-3 mr-1" />
            Paragraph
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Each paragraph is a block (line break on the home page). Within a paragraph, add segments:
        plain text, bold, or animated gradient — commas and spaces are just text segments.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Paragraph gap (rem)</Label>
          <Input
            type="number"
            step={0.125}
            min={0}
            max={4}
            value={paragraphGapRem}
            onChange={(e) => onParagraphGapRem(parseFloat(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Line height (unitless)</Label>
          <Input
            type="number"
            step={0.05}
            min={1.2}
            max={2.2}
            value={lineHeight}
            onChange={(e) => onLineHeight(parseFloat(e.target.value) || 1.625)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
        {paragraphs.map((para, pi) => (
          <div
            key={pi}
            className="rounded-lg border border-border p-3 space-y-2 bg-muted/20"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Paragraph {pi + 1}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => addRun(pi)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Segment
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeParagraph(pi)}
                  disabled={paragraphs.length <= 1}
                  aria-label="Remove paragraph"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {para.runs.map((run, ri) => (
              <div key={ri} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Select
                  value={run.type}
                  onValueChange={(v: BioRun["type"]) =>
                    patchRun(pi, ri, { ...run, type: v })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[140px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Plain text</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={run.text}
                  onChange={(e) => patchRun(pi, ri, { ...run, text: e.target.value })}
                  placeholder="Text…"
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive"
                  onClick={() => removeRun(pi, ri)}
                  disabled={para.runs.length <= 1}
                  aria-label="Remove segment"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
