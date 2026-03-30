import type { ProjectData } from "../components/ProjectImage";

export function parseColumnsValue(value: unknown, allowed: number[], fallback: number): number {
  const num = Number(value);
  return allowed.includes(num) ? num : fallback;
}

/** Map a `projects` row (snake_case) from Supabase/RPC to UI `ProjectData`. */
export function mapSupabaseProjectRowToProjectData(data: Record<string, unknown>): ProjectData {
  return {
    ...data,
    position: { x: (data.position_x as number) || 50, y: (data.position_y as number) || 50 },
    caseStudyContent: data.case_study_content as string | undefined,
    caseStudyImages: (data.case_study_images as unknown[]) || [],
    flowDiagramImages: (data.flow_diagram_images as unknown[]) || [],
    videoItems: (data.video_items as unknown[]) || [],
    caseStudySidebars: (data as { case_study_sidebars?: unknown }).case_study_sidebars || {},
    galleryAspectRatio: data.gallery_aspect_ratio as string | undefined,
    flowDiagramAspectRatio: data.flow_diagram_aspect_ratio as string | undefined,
    videoAspectRatio: data.video_aspect_ratio as string | undefined,
    galleryColumns: data.gallery_columns as number | undefined,
    flowDiagramColumns: data.flow_diagram_columns as number | undefined,
    videoColumns: data.video_columns as number | undefined,
    keyFeaturesColumns: parseColumnsValue(data.key_features_columns, [2, 3], 3) as 2 | 3,
    sectionPositions: (data.section_positions as Record<string, unknown>) || {},
    researchInsightsColumns: parseColumnsValue(
      (data as { research_insights_columns?: unknown }).research_insights_columns ??
        ((data.section_positions as { __RESEARCH_COLUMNS__?: unknown } | undefined)?.__RESEARCH_COLUMNS__),
      [1, 2, 3],
      3
    ) as 1 | 2 | 3,
    projectImagesPosition: data.project_images_position as number | undefined,
    videosPosition: data.videos_position as number | undefined,
    flowDiagramsPosition: data.flow_diagrams_position as number | undefined,
    solutionCardsPosition: data.solution_cards_position as number | undefined,
    requiresPassword: data.requires_password as boolean | undefined,
    projectType: (data.project_type as ProjectData["projectType"]) || null,
    caseStudyDecorativeIcons: Boolean((data as { case_study_decorative_icons?: unknown }).case_study_decorative_icons),
    sortOrder:
      data.sort_order !== undefined && data.sort_order !== null
        ? Number(data.sort_order)
        : undefined,
    createdAt: typeof data.created_at === 'string' ? data.created_at : undefined,
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : undefined,
    position_x: undefined,
    position_y: undefined,
    case_study_content: undefined,
    case_study_images: undefined,
    flow_diagram_images: undefined,
    video_items: undefined,
    case_study_sidebars: undefined,
    gallery_aspect_ratio: undefined,
    flow_diagram_aspect_ratio: undefined,
    video_aspect_ratio: undefined,
    gallery_columns: undefined,
    flow_diagram_columns: undefined,
    video_columns: undefined,
    key_features_columns: undefined,
    project_images_position: undefined,
    videos_position: undefined,
    flow_diagrams_position: undefined,
    solution_cards_position: undefined,
    section_positions: undefined,
    requires_password: undefined,
    case_study_decorative_icons: undefined,
    sort_order: undefined,
    created_at: undefined,
    updated_at: undefined,
  } as ProjectData;
}
