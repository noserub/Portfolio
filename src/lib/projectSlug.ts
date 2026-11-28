import projectRouteAliases from '../data/project-route-aliases.json';

const aliases = projectRouteAliases as Record<string, string>;
export const TSLIM_PROJECT_SLUG = aliases['tandem-diabetes-care'];

/** Friendly slug from project title — keep in sync with `scripts/generate-sitemap.cjs` slugify. */
export function slugFromProjectTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
export function canonicalProjectSlug(slug: string): string {
  return Object.hasOwn(aliases, slug) ? aliases[slug] : slug;
}
