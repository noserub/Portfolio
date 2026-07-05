/** Friendly slug from writing post title — keep in sync with sitemap slugify. */
export function slugFromWritingTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

export function normalizeWritingSlug(slug: string): string {
  return decodeURIComponent((slug || '').trim())
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

export function isValidWritingSlug(slug: string): boolean {
  const normalized = normalizeWritingSlug(slug);
  return normalized.length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized);
}

export function ensureUniqueWritingSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  const normalized = slugFromWritingTitle(baseSlug) || 'untitled';
  const taken = new Set(existingSlugs.map((s) => normalizeWritingSlug(s)));
  if (!taken.has(normalized)) return normalized;
  let i = 2;
  while (taken.has(`${normalized}-${i}`)) i += 1;
  return `${normalized}-${i}`;
}
