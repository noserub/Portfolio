/** Friendly slug from project title — keep in sync with `scripts/generate-sitemap.cjs` slugify. */
export function slugFromProjectTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
