import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { BioDocument } from "../lib/homePageContent";
import {
  bioDocumentToTiptapJSON,
  tiptapJSONToBioDocument,
  GradientMark,
} from "../lib/bioDocumentTiptap";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Bold, Sparkles } from "lucide-react";

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
  /** Increment when `document` was replaced externally (e.g. template) so the editor reloads without fighting typing. */
  contentRevision?: number;
}

export function HomeBioDocumentEditor({
  document,
  onChange,
  paragraphGapRem,
  lineHeight,
  onParagraphGapRem,
  onLineHeight,
  onReplaceFromTemplate,
  contentRevision = 0,
}: HomeBioDocumentEditorProps) {
  const lastAppliedRevisionRef = useRef<number | undefined>(undefined);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        italic: false,
        strike: false,
      }),
      GradientMark,
      Placeholder.configure({
        placeholder:
          "Type your bio. Press Enter for a new paragraph. Select text, then Bold or Gradient.",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: bioDocumentToTiptapJSON(document),
    editorProps: {
      attributes: {
        class: "max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(cloneDoc(tiptapJSONToBioDocument(ed.getJSON())));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const rev = contentRevision;
    if (lastAppliedRevisionRef.current === undefined) {
      lastAppliedRevisionRef.current = rev;
      return;
    }
    if (lastAppliedRevisionRef.current === rev) return;
    lastAppliedRevisionRef.current = rev;
    editor.commands.setContent(bioDocumentToTiptapJSON(document), false);
  }, [contentRevision, document, editor]);

  return (
    <div className="space-y-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Bio</h4>
        <Button type="button" variant="outline" size="sm" onClick={onReplaceFromTemplate}>
          Replace from template
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Select any text and use <strong>Bold</strong> or <strong>Gradient</strong>. Press{" "}
        <kbd className="px-1 rounded bg-muted text-[10px]">Enter</kbd> for a new paragraph (line break
        on the live site).
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

      <div className="bio-tiptap-editor rounded-lg border border-border bg-muted/10 overflow-hidden">
        {editor ? (
          <>
            <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
              <Button
                type="button"
                variant={editor.isActive("bold") ? "default" : "outline"}
                size="sm"
                className="h-8"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-pressed={editor.isActive("bold")}
              >
                <Bold className="w-3.5 h-3.5 mr-1.5" />
                Bold
              </Button>
              <Button
                type="button"
                variant={editor.isActive("gradient") ? "default" : "outline"}
                size="sm"
                className="h-8"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleGradient().run()}
                aria-pressed={editor.isActive("gradient")}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Gradient
              </Button>
            </div>
            <EditorContent editor={editor} />
          </>
        ) : (
          <div className="min-h-[10rem] animate-pulse rounded-md bg-muted/40 m-2" />
        )}
      </div>
    </div>
  );
}
