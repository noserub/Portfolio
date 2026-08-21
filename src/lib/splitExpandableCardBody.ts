/** Explicit fold in a Key decisions card. Everything after this is behind Show more. */
export const CARD_MORE_MARKER = /<!--\s*more\s*-->/i;

export const DECISION_PREVIEW_SENTENCES_KEY = "__DECISION_PREVIEW_SENTENCES__";

/** 0 = show the full card. Default collapsed preview is 2 visual lines. */
export function parseDecisionPreviewSentences(value: unknown, fallback = 2): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(6, Math.round(n)));
}

function extractSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+(?:[.!?]+(?:\s|$)|$)/g);
  if (!matches) return text.trim() ? [text.trim()] : [];
  return matches.map((part) => part.trim()).filter(Boolean);
}

export function splitExpandableCardBody(
  content: string,
  sentenceCount: number,
): { preview: string; rest: string; hasMore: boolean } {
  const trimmed = content.trim();
  if (!trimmed) return { preview: "", rest: "", hasMore: false };

  const marked = trimmed.split(CARD_MORE_MARKER);
  if (marked.length > 1) {
    const preview = marked[0].trim();
    const rest = marked.slice(1).join("").trim();
    return { preview, rest, hasMore: rest.length > 0 };
  }

  if (!Number.isFinite(sentenceCount) || sentenceCount <= 0) {
    return { preview: trimmed, rest: "", hasMore: false };
  }

  const sentences = extractSentences(trimmed);
  if (sentences.length <= sentenceCount) {
    return { preview: trimmed, rest: "", hasMore: false };
  }

  return {
    preview: sentences.slice(0, sentenceCount).join(" "),
    rest: sentences.slice(sentenceCount).join(" "),
    hasMore: true,
  };
}

export function isKeyDecisionsSectionTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  if (!t) return false;
  if (t === "key decisions" || t === "decisions") return true;
  return t.includes("key decision");
}
