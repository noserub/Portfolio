export type GalleryMediaMode = 'image' | 'video';

export type GalleryAspectRatio = '3x4' | '4x3' | '2x3' | '3x2' | '16x9' | '9x16';

export interface GalleryImageItem {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  scale?: number;
  position?: { x: number; y: number };
}

export interface GalleryVideoItem {
  id: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'upload' | 'url';
  caption?: string;
  thumbnail?: string;
}

export interface GallerySectionConfig {
  mediaMode: GalleryMediaMode;
  imageItems: GalleryImageItem[];
  videoItems: GalleryVideoItem[];
  columns: 1 | 2 | 3;
  aspectRatio: GalleryAspectRatio;
  /** When set, caps visible items in preview (edit mode always shows all). */
  previewLimit?: number | null;
  showMoreLabel?: string;
}

export interface CaseStudyGallerySection {
  id: string;
  type: 'gallery';
  title: string;
  position: number;
  visible: boolean;
  gallery: GallerySectionConfig;
}

export const GALLERY_SECTION_KEY_PREFIX = '__GALLERY__:';

export function gallerySectionKey(id: string): string {
  return `${GALLERY_SECTION_KEY_PREFIX}${id}`;
}

export function parseGallerySectionKey(key: string): string | null {
  if (!key.startsWith(GALLERY_SECTION_KEY_PREFIX)) return null;
  return key.slice(GALLERY_SECTION_KEY_PREFIX.length);
}

export function isLegacyGallerySectionId(id: string): boolean {
  return id.startsWith('legacy-');
}

export function gallerySectionHasContent(section: CaseStudyGallerySection): boolean {
  const g = section.gallery;
  if (g.mediaMode === 'video') {
    return g.videoItems.some((item) => Boolean(item.url?.trim()));
  }
  return g.imageItems.some((item) => Boolean(item.url?.trim()));
}

/** Preview: content only. Edit: also show user-added empty galleries (not legacy auto-migrations). */
export function filterGallerySectionsForDisplay(
  sections: CaseStudyGallerySection[],
  isEditMode: boolean,
): CaseStudyGallerySection[] {
  return sections.filter((section) => {
    if (!section.visible) return false;
    if (gallerySectionHasContent(section)) return true;
    return isEditMode && !isLegacyGallerySectionId(section.id);
  });
}

/** Drop empty legacy migrations before persisting — avoids ghost galleries in case_study_sections. */
export function sanitizeGallerySectionsForPersist(
  sections: CaseStudyGallerySection[],
): CaseStudyGallerySection[] {
  return sections.filter(
    (section) => gallerySectionHasContent(section) || !isLegacyGallerySectionId(section.id),
  );
}
