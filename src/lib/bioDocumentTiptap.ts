import type { JSONContent } from "@tiptap/core";
import { Mark, mergeAttributes } from "@tiptap/core";
import type { BioDocument, BioParagraph, BioRun, BioRunType } from "./homePageContent";

function marksToRunType(marks: { type: string }[] | undefined): BioRunType {
  if (!marks?.length) return "text";
  if (marks.some((m) => m.type === "gradient")) return "gradient";
  if (marks.some((m) => m.type === "bold")) return "bold";
  return "text";
}

function paragraphNodeToRuns(node: JSONContent): BioRun[] {
  if (!node.content?.length) {
    return [{ type: "text", text: "" }];
  }

  const runs: BioRun[] = [];
  for (const child of node.content) {
    if (child.type !== "text" || child.text === undefined) continue;
    const type = marksToRunType(child.marks as { type: string }[] | undefined);
    const text = child.text;
    const last = runs[runs.length - 1];
    if (last && last.type === type) {
      last.text += text;
    } else {
      runs.push({ type, text });
    }
  }
  return runs.length > 0 ? runs : [{ type: "text", text: "" }];
}

export function tiptapJSONToBioDocument(json: JSONContent): BioDocument {
  if (!json || json.type !== "doc" || !Array.isArray(json.content)) {
    return { paragraphs: [{ runs: [{ type: "text", text: "" }] }] };
  }

  const paragraphs: BioParagraph[] = [];
  for (const node of json.content) {
    if (node.type === "paragraph") {
      paragraphs.push({ runs: paragraphNodeToRuns(node) });
    }
  }

  return paragraphs.length > 0
    ? { paragraphs }
    : { paragraphs: [{ runs: [{ type: "text", text: "" }] }] };
}

function runsToTextContent(runs: BioRun[]): JSONContent[] {
  const out: JSONContent[] = [];
  for (const run of runs) {
    const marks: { type: string }[] = [];
    if (run.type === "bold") marks.push({ type: "bold" });
    if (run.type === "gradient") marks.push({ type: "gradient" });
    const text = run.text ?? "";
    if (run.type === "text" && !text) continue;
    if (run.type !== "text" && !text) continue;
    out.push({
      type: "text",
      text,
      ...(marks.length ? { marks } : {}),
    });
  }
  if (out.length === 0) {
    out.push({ type: "text", text: "" });
  }
  return out;
}

export function bioDocumentToTiptapJSON(doc: BioDocument): JSONContent {
  const paragraphs =
    doc.paragraphs?.length > 0
      ? doc.paragraphs
      : [{ runs: [{ type: "text" as const, text: "" }] }];

  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: runsToTextContent(p.runs || [{ type: "text", text: "" }]),
    })),
  };
}

/** Animated-style gradient preview while editing (static gradient, not motion). */
export const GradientMark = Mark.create({
  name: "gradient",
  inclusive: true,

  parseHTML() {
    return [{ tag: "span[data-bio-gradient]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-bio-gradient": "",
        class: "bio-gradient-mark-editor",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleGradient:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gradient: {
      toggleGradient: () => ReturnType;
    };
  }
}
