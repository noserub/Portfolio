export type ProjectLinkVariant = "primary" | "secondary" | "ghost";

export interface ProjectLink {
  label: string;
  href: string;
  variant: ProjectLinkVariant;
}

export const MAX_PROJECT_LINKS = 3;

export function coerceProjectLinksForEditor(raw: unknown): ProjectLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      label: String(item.label ?? ""),
      href: String(item.href ?? ""),
      variant: (["primary", "secondary", "ghost"].includes(String(item.variant))
        ? String(item.variant)
        : "secondary") as ProjectLinkVariant,
    }))
    .slice(0, MAX_PROJECT_LINKS);
}

/** Complete links only — for display and persistence. */
export function normalizeProjectLinks(raw: unknown): ProjectLink[] {
  return coerceProjectLinksForEditor(raw)
    .map((item) => ({
      ...item,
      label: item.label.trim(),
      href: item.href.trim(),
    }))
    .filter((item) => item.label && item.href);
}

export function getProjectLinksFromProject(project: Record<string, unknown>): ProjectLink[] {
  return normalizeProjectLinks(project.projectLinks ?? project.project_links);
}

export function emptyProjectLink(variant: ProjectLinkVariant = "secondary"): ProjectLink {
  return { label: "", href: "", variant };
}

export function projectLinksPersistedEqual(a: ProjectLink[], b: ProjectLink[]): boolean {
  const left = normalizeProjectLinks(a);
  const right = normalizeProjectLinks(b);
  if (left.length !== right.length) return false;
  return left.every(
    (link, i) =>
      link.label === right[i].label &&
      link.href === right[i].href &&
      link.variant === right[i].variant,
  );
}
