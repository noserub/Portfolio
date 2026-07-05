import { useMemo, useState, useEffect, useCallback } from 'react';
import { Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { canManageWritingPost } from '../../lib/portfolioOwner';
import { useWritingPosts } from '../../hooks/useWritingPosts';
import { useWritingIndexContent } from '../../hooks/useWritingIndexContent';
import { useWritingAuthorName } from '../../hooks/useWritingAuthorName';
import { useWritingIndexSEO } from '../../hooks/useSEO';
import { writingLayout } from '../../design/writingLayout';
import { modernLayout } from '../../design/modernLayout';
import { modern, modernFont } from '../../design/modernTokens';
import { ModernFooter } from '../../components/modern/ModernFooter';
import { ModernWritingEditBar } from '../../components/writing/ModernWritingEditBar';
import { ModernWritingIndexEditorPanel } from '../../components/writing/ModernWritingIndexEditorPanel';
import { WritingPostMeta } from '../../components/writing/WritingPostMeta';
import { WritingImage } from '../../components/writing/WritingImage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  estimateReadingTimeMinutes,
  type WritingPost,
} from '../../lib/writingPosts';
import {
  writingIndexGridClass,
  type WritingIndexGrid,
} from '../../lib/writingIndexGrid';

interface ModernWritingIndexProps {
  isEditMode?: boolean;
  onPostClick: (post: WritingPost) => void;
  onCreatePost?: (post: WritingPost) => void;
  logoUrl?: string | null;
  indexGrid?: WritingIndexGrid;
  onIndexGridChange?: (grid: WritingIndexGrid) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function ModernWritingIndex({
  isEditMode = false,
  onPostClick,
  onCreatePost,
  logoUrl,
  indexGrid = 'double',
  onIndexGridChange,
}: ModernWritingIndexProps) {
  useWritingIndexSEO();
  const { content: indexContent, ready: indexContentReady, reload: reloadIndexContent } =
    useWritingIndexContent();
  const authorName = useWritingAuthorName();
  const { posts, loading, refetch, createPost, deletePost } = useWritingPosts();

  useEffect(() => {
    void refetch(isEditMode);
  }, [isEditMode, refetch]);

  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WritingPost | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [indexEditorOpen, setIndexEditorOpen] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setSessionUserId(data.user?.id ?? null);
    });
  }, []);

  const displayPosts = useMemo(() => {
    const list = isEditMode ? posts : posts.filter((p) => p.published);
    if (!topicFilter) return list;
    return list.filter((p) => p.topics.includes(topicFilter));
  }, [posts, isEditMode, topicFilter]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [posts]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      await refetch(true);
      const { post, error: createError } = await createPost('Untitled post');
      if (post) {
        toast.success('Draft created');
        onCreatePost?.(post);
      } else {
        toast.error(createError ?? 'Could not create post. Sign in and try again.');
      }
    } catch {
      toast.error('Could not create post.');
    } finally {
      setCreating(false);
    }
  }, [createPost, onCreatePost, refetch]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { ok, error } = await deletePost(deleteTarget.id);
    if (ok) {
      toast.success('Post deleted');
      await refetch(isEditMode);
    } else {
      toast.error(error ?? 'Could not delete post');
    }
    setDeleteTarget(null);
  };

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <section className={`relative ${writingLayout.shell}`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="modern-hero-glow modern-hero-glow--about" />
        </div>
        <div className={`relative ${modernLayout.container}`}>
          {isEditMode ? (
            <ModernWritingEditBar
              onNewPost={() => void handleCreate()}
              creating={creating}
              indexGrid={indexGrid}
              onIndexGridChange={onIndexGridChange}
            />
          ) : null}

          {isEditMode ? (
            <div className="mb-6">
              <button
                type="button"
                className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
                style={modernFont}
                onClick={() => setIndexEditorOpen(true)}
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden />
                Edit writing page
              </button>
            </div>
          ) : null}

          <header className={writingLayout.indexHero}>
            {!indexContentReady ? (
              <div className="space-y-4" aria-hidden>
                <div className="h-4 w-24 rounded animate-pulse" style={{ background: modern.surface }} />
                <div className="h-10 w-full max-w-xl rounded animate-pulse" style={{ background: modern.surface }} />
                <div className="h-16 w-full max-w-2xl rounded animate-pulse" style={{ background: modern.surface }} />
              </div>
            ) : (
              <>
                <p
                  className="text-xs uppercase tracking-widest mb-4"
                  style={{ ...modernFont, fontWeight: 600, color: modern.accent }}
                >
                  {indexContent.eyebrow}
                </p>
                <h1 className={writingLayout.indexTitle}>{indexContent.title}</h1>
                <p className={writingLayout.indexLead}>{indexContent.lead}</p>
              </>
            )}
          </header>

          {allTopics.length > 0 ? (
            <div className={writingLayout.filterRow}>
              <button
                type="button"
                className={`${writingLayout.filterChip} ${!topicFilter ? writingLayout.filterChipActive : ''}`}
                onClick={() => setTopicFilter(null)}
              >
                All
              </button>
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`${writingLayout.filterChip} ${topicFilter === topic ? writingLayout.filterChipActive : ''}`}
                  onClick={() => setTopicFilter(topic === topicFilter ? null : topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <p style={{ ...modernFont, color: modern.muted }}>Loading…</p>
          ) : displayPosts.length === 0 ? (
            <div className={writingLayout.empty}>
              {isEditMode
                ? 'No posts yet. Use New post above to create your first draft.'
                : 'No published posts yet.'}
            </div>
          ) : (
            <div className={writingIndexGridClass(indexGrid)}>
              {displayPosts.map((post) => (
                <div key={post.id} className={writingLayout.cardWrap}>
                  <button
                    type="button"
                    className={writingLayout.card}
                    onClick={() => onPostClick(post)}
                  >
                    {post.hero_image ? (
                      <WritingImage
                        src={post.hero_image}
                        alt=""
                        crop={post.hero_image_crop}
                        wrapperClassName="modern-writing-card__thumb-wrap"
                        className="modern-writing-card__thumb"
                      />
                    ) : null}
                    {!post.published && isEditMode ? (
                      <span className={writingLayout.draftBadge}>Draft</span>
                    ) : null}
                    <h2 className={writingLayout.cardTitle}>{post.title}</h2>
                    {post.excerpt ? (
                      <p className={writingLayout.cardExcerpt}>{post.excerpt}</p>
                    ) : null}
                    <WritingPostMeta
                      author={authorName}
                      date={post.published_at ? formatDate(post.published_at) : undefined}
                      readingMinutes={estimateReadingTimeMinutes(post.blocks)}
                      topics={post.topics.slice(0, 3)}
                    />
                  </button>
                  {isEditMode ? (
                    <div className={writingLayout.cardActions}>
                      <button type="button" onClick={() => onPostClick(post)}>
                        Edit
                      </button>
                      {canManageWritingPost(post.user_id, sessionUserId) ? (
                        <button
                          type="button"
                          className="modern-writing-card-actions__delete"
                          onClick={() => setDeleteTarget(post)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span
                          className="text-xs text-muted-foreground self-center"
                          style={{ ...modernFont }}
                        >
                          Not owned by your session
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <ModernFooter logoUrl={logoUrl} />

      <ModernWritingIndexEditorPanel
        open={indexEditorOpen}
        onCancel={() => setIndexEditorOpen(false)}
        onSaved={() => {
          setIndexEditorOpen(false);
          reloadIndexContent();
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This permanently removes “${deleteTarget.title}” and cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
