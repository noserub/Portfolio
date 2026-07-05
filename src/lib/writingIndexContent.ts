import { getPortfolioOwnerUserId, getProfileWriterUserId } from './portfolioOwner';
import { supabase } from './supabaseClient';

export interface WritingIndexContent {
  eyebrow: string;
  title: string;
  lead: string;
}

export const DEFAULT_WRITING_INDEX_CONTENT: WritingIndexContent = {
  eyebrow: 'Writing',
  title: 'Essays & notes',
  lead: 'Essays on enterprise AI, product design, and shipping trustworthy agent experiences.',
};

const STORAGE_KEY = 'writingIndexContent';

function trim(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  return next || fallback;
}

export function parseWritingIndexContent(raw: unknown): WritingIndexContent {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_WRITING_INDEX_CONTENT };
  const value = raw as Record<string, unknown>;
  return {
    eyebrow: trim(value.eyebrow, DEFAULT_WRITING_INDEX_CONTENT.eyebrow),
    title: trim(value.title, DEFAULT_WRITING_INDEX_CONTENT.title),
    lead: trim(value.lead, DEFAULT_WRITING_INDEX_CONTENT.lead),
  };
}

function readLocalWritingIndexContent(): WritingIndexContent | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return parseWritingIndexContent(JSON.parse(saved));
  } catch {
    return null;
  }
}

export function writeLocalWritingIndexContent(content: WritingIndexContent) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch {
    /* ignore quota errors */
  }
}

export async function fetchWritingIndexContent(): Promise<WritingIndexContent> {
  const local = readLocalWritingIndexContent();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);

    const { data, error } = await supabase
      .from('page_visibility')
      .select('writing_index_content')
      .eq('user_id', ownerId)
      .maybeSingle();

    if (data && !error && data.writing_index_content != null) {
      const parsed = parseWritingIndexContent(data.writing_index_content);
      writeLocalWritingIndexContent(parsed);
      return parsed;
    }
  } catch {
    /* fall through */
  }

  if (local) return local;
  return { ...DEFAULT_WRITING_INDEX_CONTENT };
}

export async function saveWritingIndexContent(content: WritingIndexContent): Promise<boolean> {
  const normalized = parseWritingIndexContent(content);
  writeLocalWritingIndexContent(normalized);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const writerUserId = getProfileWriterUserId(user?.id);

    const { data: updated, error: updateError } = await supabase
      .from('page_visibility')
      .update({
        writing_index_content: normalized,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', writerUserId)
      .select('id')
      .maybeSingle();

    if (updateError || !updated) {
      const { error: insertError } = await supabase.from('page_visibility').insert({
        user_id: writerUserId,
        writing_index_content: normalized,
      });
      if (insertError) {
        console.warn('Failed to save writing index content:', insertError.message);
        return false;
      }
    }

    window.dispatchEvent(new CustomEvent('writing-index-content-updated'));
    return true;
  } catch (err) {
    console.warn('Failed to save writing index content:', err);
    return false;
  }
}
