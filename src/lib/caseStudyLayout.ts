import {
  gallerySectionKey,
  parseGallerySectionKey,
  type CaseStudyGallerySection,
} from '../types/caseStudySections';

export const SOLUTION_CARDS_LAYOUT_KEY = '__SOLUTION_CARDS__';

/** Recompute stored insert indices from a rendered layout key list. */
export function deriveGalleryPositionsFromLayout(
  layoutKeys: string[],
): { galleryPositions: Map<string, number>; solutionCardsPosition: number | null } {
  const galleryPositions = new Map<string, number>();
  let sectionCount = 0;
  let solutionCardsPosition: number | null = null;
  let pendingGalleryIds: string[] = [];

  const flushGalleries = () => {
    for (const galleryId of pendingGalleryIds) {
      galleryPositions.set(galleryId, sectionCount);
    }
    pendingGalleryIds = [];
  };

  for (const key of layoutKeys) {
    const galleryId = parseGallerySectionKey(key);
    if (galleryId) {
      pendingGalleryIds.push(galleryId);
      continue;
    }

    if (key === SOLUTION_CARDS_LAYOUT_KEY) {
      flushGalleries();
      solutionCardsPosition = sectionCount;
      continue;
    }

    // Mobile-only sidebars and other special slots are not reorder anchors.
    if (key.startsWith('__') && key.endsWith('__')) {
      continue;
    }

    flushGalleries();
    sectionCount += 1;
  }

  flushGalleries();
  return { galleryPositions, solutionCardsPosition };
}

/** Apply positions from layout and preserve gallery order for equal-position inserts. */
export function applyLayoutToGallerySections(
  sections: CaseStudyGallerySection[],
  layoutKeys: string[],
): CaseStudyGallerySection[] {
  const { galleryPositions } = deriveGalleryPositionsFromLayout(layoutKeys);
  const layoutGalleryIds = layoutKeys
    .map((key) => parseGallerySectionKey(key))
    .filter((id): id is string => Boolean(id));

  const byId = new Map(sections.map((section) => [section.id, section]));
  const ordered: CaseStudyGallerySection[] = [];

  for (const id of layoutGalleryIds) {
    const section = byId.get(id);
    if (section) ordered.push(section);
  }

  for (const section of sections) {
    if (!layoutGalleryIds.includes(section.id)) {
      ordered.push(section);
    }
  }

  return ordered.map((section) => ({
    ...section,
    position: galleryPositions.get(section.id) ?? section.position,
  }));
}

export function swapLayoutKeys(
  layoutKeys: string[],
  currentIndex: number,
  direction: 'up' | 'down',
): string[] | null {
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= layoutKeys.length) return null;

  const next = [...layoutKeys];
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

export function galleryLayoutKey(sectionId: string): string {
  return gallerySectionKey(sectionId);
}
