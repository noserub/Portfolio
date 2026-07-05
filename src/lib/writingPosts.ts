import type { WritingBlock, WritingLayout } from '../types/writingBlocks';
import { parseWritingBlocks } from '../types/writingBlocks';
import { parseWritingImageCrop, type ImageCropFrame } from './writingImageFrame';
import { supabase } from './supabaseClient';
import { getPortfolioOwnerUserId } from './portfolioOwner';
import { normalizeWritingSlug } from './writingSlug';

export interface WritingPost {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  hero_image: string | null;
  hero_image_crop: ImageCropFrame | null;
  hero_image_lightbox: boolean;
  layout: WritingLayout;
  topics: string[];
  blocks: WritingBlock[];
  linkedin_url: string | null;
  published: boolean;
  published_at: string | null;
  sort_order: number;
}

export interface WritingPostInsert {
  user_id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  hero_image?: string | null;
  hero_image_crop?: ImageCropFrame | null;
  hero_image_lightbox?: boolean;
  layout?: WritingLayout;
  topics?: string[];
  blocks?: WritingBlock[];
  linkedin_url?: string | null;
  published?: boolean;
  published_at?: string | null;
  sort_order?: number;
}

export interface WritingPostUpdate {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  hero_image?: string | null;
  hero_image_crop?: ImageCropFrame | null;
  hero_image_lightbox?: boolean;
  layout?: WritingLayout;
  topics?: string[];
  blocks?: WritingBlock[];
  linkedin_url?: string | null;
  published?: boolean;
  published_at?: string | null;
  sort_order?: number;
  updated_at?: string;
}

export function mapWritingPostRow(row: Record<string, unknown>): WritingPost {
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    user_id: String(row.user_id ?? ''),
    slug: String(row.slug ?? ''),
    title: String(row.title ?? ''),
    subtitle: row.subtitle != null ? String(row.subtitle) : null,
    excerpt: row.excerpt != null ? String(row.excerpt) : null,
    hero_image: row.hero_image != null ? String(row.hero_image) : null,
    hero_image_crop: parseWritingImageCrop(row.hero_image_crop),
    hero_image_lightbox: Boolean(row.hero_image_lightbox),
    layout: (row.layout as WritingLayout) || 'essay',
    topics: Array.isArray(row.topics) ? row.topics.map(String) : [],
    blocks: parseWritingBlocks(row.blocks),
    linkedin_url: row.linkedin_url != null ? String(row.linkedin_url) : null,
    published: Boolean(row.published),
    published_at: row.published_at != null ? String(row.published_at) : null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function estimateReadingTimeMinutes(blocks: WritingBlock[]): number {
  const words = blocks
    .filter((b) => b.visible && b.type === 'prose')
    .map((b) => (b.type === 'prose' ? b.content : ''))
    .join(' ')
    .replace(/[#>*_\[\]()!`~-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function extractProsePlainText(blocks: WritingBlock[], maxLen = 420): string {
  const text = blocks
    .filter((b) => b.visible && b.type === 'prose')
    .map((b) => (b.type === 'prose' ? b.content : ''))
    .join('\n\n')
    .replace(/[#>*_\[\]()!`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

export function buildWritingPostUpdatePayload(
  post: WritingPost,
  patch: WritingPostUpdate,
): WritingPostUpdate {
  const nextPublished = patch.published ?? post.published;
  const wasPublished = post.published;
  const payload: WritingPostUpdate = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (nextPublished && !wasPublished && !patch.published_at && !post.published_at) {
    payload.published_at = new Date().toISOString();
  }
  if (!nextPublished) {
    payload.published_at = patch.published_at ?? post.published_at;
  }
  return payload;
}

export function defaultWritingPostInsert(
  userId: string,
  title: string,
  slug: string,
): WritingPostInsert {
  return {
    user_id: userId,
    slug,
    title,
    subtitle: null,
    excerpt: '',
    hero_image: null,
    hero_image_crop: null,
    hero_image_lightbox: false,
    layout: 'essay',
    topics: [],
    blocks: [],
    linkedin_url: null,
    published: false,
    published_at: null,
    sort_order: Math.floor(Date.now() / 1000),
  };
}

export function extractHeadingIdsFromProse(blocks: WritingBlock[]): Array<{ id: string; text: string }> {
  const headings: Array<{ id: string; text: string }> = [];
  for (const block of blocks) {
    if (!block.visible || block.type !== 'prose') continue;
    const lines = block.content.split('\n');
    for (const line of lines) {
      const match = line.match(/^##\s+(.+)$/);
      if (!match) continue;
      const text = match[1].replace(/[*_`]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      if (id) headings.push({ id, text });
    }
  }
  return headings;
}

export async function findWritingPostBySlug(
  slug: string,
  options?: { includeDrafts?: boolean },
): Promise<WritingPost | null> {
  const normalized = normalizeWritingSlug(slug);
  if (!normalized) return null;

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (options?.includeDrafts && authData.user) {
      const ownerId = getPortfolioOwnerUserId(authData.user.id);
      const { data, error } = await supabase
        .from('writing_posts')
        .select('*')
        .eq('user_id', ownerId)
        .eq('slug', normalized)
        .maybeSingle();
      if (error) throw error;
      return data ? mapWritingPostRow(data as Record<string, unknown>) : null;
    }

    const ownerId = getPortfolioOwnerUserId(authData.user?.id);
    const { data, error } = await supabase.rpc('get_writing_post_by_slug_public', {
      p_slug: normalized,
      p_owner_id: ownerId,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row ? mapWritingPostRow(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('findWritingPostBySlug failed:', error);
    return null;
  }
}
