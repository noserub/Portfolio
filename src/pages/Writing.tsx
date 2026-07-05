import { useDesignVariant } from '../design/DesignVariantContext';
import { ModernWritingIndex } from './modern/ModernWritingIndex';
import type { WritingPost } from '../lib/writingPosts';
import type { WritingIndexGrid } from '../lib/writingIndexGrid';

interface WritingProps {
  isEditMode?: boolean;
  onPostClick: (post: WritingPost) => void;
  onCreatePost?: (post: WritingPost) => void;
  logoUrl?: string | null;
  indexGrid?: WritingIndexGrid;
  onIndexGridChange?: (grid: WritingIndexGrid) => void;
}

export function Writing({
  isEditMode,
  onPostClick,
  onCreatePost,
  logoUrl,
  indexGrid,
  onIndexGridChange,
}: WritingProps) {
  const { effectiveVariant } = useDesignVariant();
  const variant = effectiveVariant(Boolean(isEditMode));

  if (variant === 'modern') {
    return (
      <ModernWritingIndex
        isEditMode={isEditMode}
        onPostClick={onPostClick}
        onCreatePost={onCreatePost}
        logoUrl={logoUrl}
        indexGrid={indexGrid}
        onIndexGridChange={onIndexGridChange}
      />
    );
  }

  return (
    <ModernWritingIndex
      isEditMode={isEditMode}
      onPostClick={onPostClick}
      onCreatePost={onCreatePost}
      logoUrl={logoUrl}
      indexGrid={indexGrid}
      onIndexGridChange={onIndexGridChange}
    />
  );
}

export default Writing;
