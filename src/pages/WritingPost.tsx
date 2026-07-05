import { useDesignVariant } from '../design/DesignVariantContext';
import { ModernWritingPostView } from './modern/ModernWritingPost';
import type { WritingPost, WritingPostUpdate } from '../lib/writingPosts';

interface WritingPostPageProps {
  post: WritingPost;
  isEditMode?: boolean;
  onBack: () => void;
  onSave: (id: string, patch: WritingPostUpdate) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onCreatePost?: (post: WritingPost) => void;
  logoUrl?: string | null;
}

export function WritingPostPage({
  post,
  isEditMode,
  onBack,
  onSave,
  onDelete,
  onCreatePost,
  logoUrl,
}: WritingPostPageProps) {
  const { effectiveVariant } = useDesignVariant();
  effectiveVariant(Boolean(isEditMode));

  return (
    <ModernWritingPostView
      post={post}
      isEditMode={isEditMode}
      onBack={onBack}
      onSave={onSave}
      onDelete={onDelete}
      onCreatePost={onCreatePost}
      logoUrl={logoUrl}
    />
  );
}

export default WritingPostPage;
