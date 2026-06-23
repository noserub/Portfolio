import { useMemo } from "react";
import type { ProjectData } from "../components/ProjectImage";
import { mapSupabaseProjectRowToProjectData } from "./mapSupabaseProjectRowToProjectData";
import type { Project } from "../hooks/useProjects";

/** Remove HTML tags for plain-text modern cards (highlights often store legacy markup). */
export function stripHtmlForDisplay(value: string): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanModernProjectUrl(url: string, title?: string): string {
  if (!url || url.trim() === "" || url === "NULL" || url === "null") {
    return "";
  }
  if (
    url.startsWith("blob:") ||
    url.includes("localhost:3000") ||
    url.includes("net::ERR_FILE_NOT_FOUND")
  ) {
    return "";
  }
  return url;
}

function isCaseStudyRow(project: Project): boolean {
  const title = project.title?.toLowerCase() || "";
  const description = project.description?.toLowerCase() || "";
  const hasImages = (project.case_study_images?.length || 0) > 0;
  const hasContent = (project.case_study_content || "").trim().length > 0;
  const isPublished = Boolean(project.published);

  const isCaseStudy =
    isPublished ||
    hasImages ||
    hasContent ||
    description.includes("case study") ||
    title.includes("case study") ||
    title.includes("tandem diabetes care") ||
    title.includes("skype qik") ||
    title.includes("research") ||
    title.includes("study");

  const isDesignOnly =
    title.includes("modern tech") ||
    title.includes("web design") ||
    title.includes("abstract art") ||
    title.includes("product design") ||
    title.includes("design system");

  return isCaseStudy && !isDesignOnly;
}

function dedupeProjectsByTitle(projects: Project[]): Project[] {
  const seen = new Map<string, Project>();
  for (const project of projects) {
    const existing = seen.get(project.title);
    if (!existing) {
      seen.set(project.title, project);
      continue;
    }
    const isNewer =
      project.updated_at > existing.updated_at ||
      (project.updated_at === existing.updated_at && project.id > existing.id);
    if (isNewer) seen.set(project.title, project);
  }
  return Array.from(seen.values());
}

export function mapRowToModernProjectData(row: Project): ProjectData {
  const mapped = mapSupabaseProjectRowToProjectData(row as unknown as Record<string, unknown>);
  const url = cleanModernProjectUrl(String(row.url || mapped.url || ""), row.title);
  return {
    ...mapped,
    url,
    published: Boolean(row.published),
    projectType: (row.project_type ?? mapped.projectType ?? null) as ProjectData["projectType"],
    sortOrder: row.sort_order ?? mapped.sortOrder,
  };
}

export function projectTypeTag(project: ProjectData): string {
  const type = project.projectType || (project as { project_type?: string }).project_type;
  if (type === "product-design") return "Product Design";
  if (type === "development") return "Development";
  if (type === "branding") return "Branding";
  return "Case Study";
}

export function useModernCaseStudies(projects: Project[], loading: boolean, isEditMode = false) {
  const caseStudies = useMemo(() => {
    if (loading || !projects.length) return [];

    return dedupeProjectsByTitle(projects)
      .filter(isCaseStudyRow)
      .filter((p) => isEditMode || Boolean(p.published))
      .map(mapRowToModernProjectData)
      .sort((a, b) => {
        if (isEditMode) {
          const aPub = Boolean(a.published);
          const bPub = Boolean(b.published);
          if (aPub && !bPub) return -1;
          if (!aPub && bPub) return 1;
        }
        const aOrder = a.sortOrder ?? 0;
        const bOrder = b.sortOrder ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.id).localeCompare(String(b.id));
      });
  }, [projects, loading, isEditMode]);

  return caseStudies;
}

/** Layout for flat index in the modern home grid (featured wide + 2-col rest). */
export function modernCaseStudyCardLayout(index: number, total: number): "regular" | "wide" {
  if (total <= 0) return "regular";
  if (index === 0) return "wide";
  const restCount = total - 1;
  const isLast = index === total - 1;
  if (isLast && restCount % 2 === 1) return "wide";
  return "regular";
}

export interface CaseStudyGridLayout {
  featured: ProjectData | null;
  rest: ProjectData[];
}

/**
 * Split case studies for modern home grid: one wide featured card first, remainder in 2-col grid.
 * Pinned id is used when present in the list; otherwise first item (lowest sort_order).
 */
export function layoutCaseStudiesForGrid(
  projects: ProjectData[],
  featuredCaseStudyId?: string | null,
): CaseStudyGridLayout {
  if (projects.length === 0) {
    return { featured: null, rest: [] };
  }

  const pinned = featuredCaseStudyId
    ? projects.find((p) => String(p.id) === String(featuredCaseStudyId))
    : undefined;
  const featured = pinned ?? projects[0];
  const rest = projects.filter((p) => p.id !== featured.id);

  return { featured, rest };
}
