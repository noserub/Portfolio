import type { ProjectData } from '../components/ProjectImage';
import type {
  CaseStudyGallerySection,
  GalleryAspectRatio,
  GalleryImageItem,
  GallerySectionConfig,
  GalleryVideoItem,
} from '../types/caseStudySections';

function newId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function parseColumns(value: unknown, fallback: 1 | 2 | 3 = 2): 1 | 2 | 3 {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 ? n : fallback;
}

function parseAspectRatio(value: unknown, fallback: GalleryAspectRatio = '16x9'): GalleryAspectRatio {
  const allowed: GalleryAspectRatio[] = ['3x4', '4x3', '2x3', '3x2', '16x9', '9x16'];
  return allowed.includes(value as GalleryAspectRatio) ? (value as GalleryAspectRatio) : fallback;
}

function normalizeImageItems(items: unknown): GalleryImageItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === 'object' && 'url' in item)
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id || newId()),
        url: String(row.url || ''),
        alt: String(row.alt || row.caption || 'Image'),
        caption: row.caption ? String(row.caption) : undefined,
        scale: typeof row.scale === 'number' ? row.scale : undefined,
        position:
          row.position && typeof row.position === 'object'
            ? (row.position as { x: number; y: number })
            : undefined,
      };
    });
}

function normalizeVideoItems(items: unknown): GalleryVideoItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === 'object' && 'url' in item)
    .map((item) => {
      const row = item as Record<string, unknown>;
      const type = row.type;
      const videoType =
        type === 'youtube' || type === 'vimeo' || type === 'upload' || type === 'url'
          ? type
          : 'url';
      return {
        id: String(row.id || newId()),
        url: String(row.url || ''),
        type: videoType,
        caption: row.caption ? String(row.caption) : undefined,
        thumbnail: row.thumbnail ? String(row.thumbnail) : undefined,
      };
    });
}

function normalizeGalleryConfig(raw: unknown): GallerySectionConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;
  const mediaMode = g.mediaMode === 'video' ? 'video' : 'image';
  return {
    mediaMode,
    imageItems: normalizeImageItems(g.imageItems),
    videoItems: normalizeVideoItems(g.videoItems),
    columns: parseColumns(g.columns, 2),
    aspectRatio: parseAspectRatio(g.aspectRatio, mediaMode === 'video' ? '16x9' : '16x9'),
    previewLimit:
      g.previewLimit === null || g.previewLimit === undefined
        ? null
        : Number.isFinite(Number(g.previewLimit))
          ? Number(g.previewLimit)
          : null,
    showMoreLabel: g.showMoreLabel ? String(g.showMoreLabel) : undefined,
  };
}

function normalizeGallerySection(raw: unknown, index: number): CaseStudyGallerySection | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (row.type !== 'gallery') return null;
  const gallery = normalizeGalleryConfig(row.gallery);
  if (!gallery) return null;
  return {
    id: String(row.id || newId()),
    type: 'gallery',
    title: String(row.title || 'Gallery'),
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : index,
    visible: row.visible !== false,
    gallery,
  };
}

export function sortGallerySections(sections: CaseStudyGallerySection[]): CaseStudyGallerySection[] {
  return [...sections].sort((a, b) => a.position - b.position);
}

export function createGallerySection(
  title: string,
  mediaMode: 'image' | 'video',
  position: number,
): CaseStudyGallerySection {
  return {
    id: newId(),
    type: 'gallery',
    title,
    position,
    visible: true,
    gallery: {
      mediaMode,
      imageItems: [],
      videoItems: [],
      columns: mediaMode === 'video' ? 1 : 2,
      aspectRatio: mediaMode === 'video' ? '16x9' : '16x9',
      previewLimit: null,
      showMoreLabel: 'Show more',
    },
  };
}

/** Read gallery sections from project — prefers `case_study_sections`, else migrates legacy fields. */
export function resolveGallerySections(project: ProjectData & Record<string, unknown>): CaseStudyGallerySection[] {
  const stored =
    (project as { caseStudySections?: unknown }).caseStudySections ??
    project.case_study_sections;

  if (Array.isArray(stored) && stored.length > 0) {
    const parsed = stored
      .map((row, index) => normalizeGallerySection(row, index))
      .filter((s): s is CaseStudyGallerySection => Boolean(s));
    if (parsed.length > 0) {
      return sortGallerySections(parsed);
    }
  }

  const legacy: CaseStudyGallerySection[] = [];

  const projectImages = project.caseStudyImages ?? (project.case_study_images as GalleryImageItem[]) ?? [];
  const projectImagesPosition = project.projectImagesPosition ?? project.project_images_position;
  if (projectImages.length > 0 || projectImagesPosition != null) {
    legacy.push({
      id: 'legacy-project-images',
      type: 'gallery',
      title: 'Project Images',
      position: projectImagesPosition ?? 2,
      visible: true,
      gallery: {
        mediaMode: 'image',
        imageItems: normalizeImageItems(projectImages),
        videoItems: [],
        columns: parseColumns(project.galleryColumns ?? project.gallery_columns, 2),
        aspectRatio: parseAspectRatio(project.galleryAspectRatio ?? project.gallery_aspect_ratio, '3x4'),
        previewLimit: null,
      },
    });
  }

  const videos = project.videoItems ?? (project.video_items as GalleryVideoItem[]) ?? [];
  const videosPosition = project.videosPosition ?? project.videos_position;
  if (videos.length > 0 || videosPosition != null) {
    legacy.push({
      id: 'legacy-videos',
      type: 'gallery',
      title: 'Videos',
      position: videosPosition ?? 998,
      visible: true,
      gallery: {
        mediaMode: 'video',
        imageItems: [],
        videoItems: normalizeVideoItems(videos),
        columns: parseColumns(project.videoColumns ?? project.video_columns, 1),
        aspectRatio: parseAspectRatio(project.videoAspectRatio ?? project.video_aspect_ratio, '16x9'),
        previewLimit: null,
      },
    });
  }

  const flowDiagrams =
    project.flowDiagramImages ?? (project.flow_diagram_images as GalleryImageItem[]) ?? [];
  const flowDiagramsPosition = project.flowDiagramsPosition ?? project.flow_diagrams_position;
  if (flowDiagrams.length > 0 || flowDiagramsPosition != null) {
    legacy.push({
      id: 'legacy-flow-diagrams',
      type: 'gallery',
      title: 'Flow Diagrams',
      position: flowDiagramsPosition ?? 1000,
      visible: true,
      gallery: {
        mediaMode: 'image',
        imageItems: normalizeImageItems(flowDiagrams),
        videoItems: [],
        columns: parseColumns(project.flowDiagramColumns ?? project.flow_diagram_columns, 1),
        aspectRatio: parseAspectRatio(
          project.flowDiagramAspectRatio ?? project.flow_diagram_aspect_ratio,
          '16x9',
        ),
        previewLimit: null,
      },
    });
  }

  return sortGallerySections(legacy);
}

/** Mirror first gallery of each legacy type for backward-compatible DB columns. */
export function syncLegacyGalleryFieldsFromSections(
  sections: CaseStudyGallerySection[],
): Pick<
  ProjectData,
  | 'caseStudyImages'
  | 'flowDiagramImages'
  | 'videoItems'
  | 'galleryAspectRatio'
  | 'flowDiagramAspectRatio'
  | 'videoAspectRatio'
  | 'galleryColumns'
  | 'flowDiagramColumns'
  | 'videoColumns'
  | 'projectImagesPosition'
  | 'videosPosition'
  | 'flowDiagramsPosition'
> {
  const visible = sortGallerySections(sections.filter((s) => s.visible));
  const firstImage = visible.find((s) => s.gallery.mediaMode === 'image');
  const secondImage = visible.filter((s) => s.gallery.mediaMode === 'image')[1];
  const firstVideo = visible.find((s) => s.gallery.mediaMode === 'video');

  const projectImages =
    firstImage?.id === 'legacy-project-images' || !secondImage
      ? firstImage
      : firstImage;

  const flowDiagrams =
    firstImage && firstImage.id === 'legacy-flow-diagrams'
      ? firstImage
      : secondImage?.id === 'legacy-flow-diagrams'
        ? secondImage
        : visible.find((s) => s.title.toLowerCase().includes('flow'));

  return {
    caseStudyImages: projectImages?.gallery.imageItems ?? [],
    flowDiagramImages: flowDiagrams?.gallery.imageItems ?? [],
    videoItems: firstVideo?.gallery.videoItems ?? [],
    galleryAspectRatio: (projectImages?.gallery.aspectRatio || '3x4') as ProjectData['galleryAspectRatio'],
    flowDiagramAspectRatio: (flowDiagrams?.gallery.aspectRatio || '16x9') as ProjectData['flowDiagramAspectRatio'],
    videoAspectRatio: (firstVideo?.gallery.aspectRatio || '16x9') as ProjectData['videoAspectRatio'],
    galleryColumns: projectImages?.gallery.columns ?? 2,
    flowDiagramColumns: flowDiagrams?.gallery.columns ?? 1,
    videoColumns: firstVideo?.gallery.columns ?? 1,
    projectImagesPosition: projectImages?.position,
    videosPosition: firstVideo?.position,
    flowDiagramsPosition: flowDiagrams?.position,
  };
}

export function getNextGalleryPosition(
  sections: CaseStudyGallerySection[],
  legacyPositions: {
    projectImagesPosition?: number;
    videosPosition?: number;
    flowDiagramsPosition?: number;
    solutionCardsPosition?: number | null;
  },
  markdownSectionCount: number,
): number {
  const candidates = [
    ...sections.map((s) => s.position),
    legacyPositions.projectImagesPosition,
    legacyPositions.videosPosition,
    legacyPositions.flowDiagramsPosition,
    legacyPositions.solutionCardsPosition ?? undefined,
    markdownSectionCount,
  ].filter((n): n is number => typeof n === 'number' && Number.isFinite(n));

  const max = candidates.length > 0 ? Math.max(...candidates) : 0;
  return max + 1;
}
