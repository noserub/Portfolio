import { useMemo, useCallback, useState, lazy, Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useWritingPostSEO } from '../../hooks/useSEO';
import { useWritingAuthorName } from '../../hooks/useWritingAuthorName';
import { useWritingPosts } from '../../hooks/useWritingPosts';
import { useProjects } from '../../contexts/ProjectsContext';
import { writingArticleClass, writingLayout } from '../../design/writingLayout';
import { modernLayout } from '../../design/modernLayout';
import { modern, modernFont } from '../../design/modernTokens';
import { ModernFooter } from '../../components/modern/ModernFooter';
import { ModernWritingEditBar } from '../../components/writing/ModernWritingEditBar';
import { WritingImage } from '../../components/writing/WritingImage';
import { WritingPostMeta } from '../../components/writing/WritingPostMeta';
import { WritingBlockRenderer, WritingPostLinkedInLink } from '../../components/writing/WritingBlockRenderer';
import { WritingBlocksEditor } from '../../components/writing/WritingBlocksEditor';
import { resolveStoragePublicUrl } from '../../utils/imageOptimizer';
import {
  estimateReadingTimeMinutes,
  extractHeadingIdsFromProse,
  type WritingPost,
  type WritingPostUpdate,
} from '../../lib/writingPosts';
import { slugFromProjectTitle } from '../../lib/projectSlug';

const Lightbox = lazy(() =>
  import('../../components/Lightbox').then((m) => ({ default: m.default })),
);

interface ModernWritingPostProps {
  post: WritingPost;
  isEditMode?: boolean;
  onBack: () => void;
  onSave: (id: string, patch: WritingPostUpdate) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onCreatePost?: (post: WritingPost) => void;
  logoUrl?: string | null;
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

export function ModernWritingPostView({
  post,
  isEditMode = false,
  onBack,
  onSave,
  onDelete,
  onCreatePost,
  logoUrl,
}: ModernWritingPostProps) {
  useWritingPostSEO(post.id, post.title, {
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    publishedAt: post.published_at,
    slug: post.slug,
    excerpt: post.excerpt,
    heroImage: post.hero_image,
    topics: post.topics,
  });

  const authorName = useWritingAuthorName();

  const { projects } = useProjects();
  const { posts, refetch, createPost } = useWritingPosts();
  const [creating, setCreating] = useState(false);
  const [heroLightboxOpen, setHeroLightboxOpen] = useState(false);

  const caseStudies = useMemo(
    () =>
      (projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        slug: slugFromProjectTitle(p.title),
      })),
    [projects],
  );

  const writingPosts = useMemo(
    () => posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
    [posts],
  );

  const existingSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);

  const headings = useMemo(() => extractHeadingIdsFromProse(post.blocks), [post.blocks]);
  const showToc = !isEditMode && headings.length >= 3;

  const relatedPosts = useMemo(() => {
    if (!post.topics.length) return [];
    return posts
      .filter(
        (p) =>
          p.id !== post.id &&
          p.published &&
          p.topics.some((t) => post.topics.includes(t)),
      )
      .slice(0, 2);
  }, [posts, post]);

  const readingMinutes = estimateReadingTimeMinutes(post.blocks);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      await refetch(true);
      const { post: created, error: createError } = await createPost('Untitled post');
      if (created) {
        toast.success('Draft created');
        onCreatePost?.(created);
      } else {
        toast.error(createError ?? 'Could not create post. Sign in and try again.');
      }
    } catch {
      toast.error('Could not create post.');
    } finally {
      setCreating(false);
    }
  }, [createPost, onCreatePost, refetch]);

  if (isEditMode) {
    return (
      <main className="min-h-screen" style={{ background: modern.bg }}>
        <section className={`relative ${writingLayout.shell}`}>
        <div className="modern-hero-glow modern-hero-glow--about" aria-hidden />
        <div className={`relative ${modernLayout.container}`}>
          <ModernWritingEditBar onNewPost={() => void handleCreate()} creating={creating} />
            <button type="button" onClick={onBack} className={writingLayout.back}>
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back to Writing
            </button>
            <WritingBlocksEditor
              post={post}
              caseStudies={caseStudies}
              posts={writingPosts}
              existingSlugs={existingSlugs}
              onSave={(patch) => onSave(post.id, patch)}
              onDelete={
                onDelete
                  ? async () => {
                      const ok = await onDelete(post.id);
                      if (ok) onBack();
                    }
                  : undefined
              }
            />
          </div>
        </section>
        <ModernFooter logoUrl={logoUrl} />
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <section className={`relative ${writingLayout.shell}`}>
        <div className="modern-hero-glow modern-hero-glow--about" aria-hidden />
        <div className={`relative ${modernLayout.container}`}>
          <button type="button" onClick={onBack} className={writingLayout.back}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Writing
          </button>

          {post.layout === 'magazine' && post.hero_image ? (
            post.hero_image_lightbox ? (
              <>
                <button
                  type="button"
                  className="modern-writing-hero modern-writing-hero--lightbox"
                  onClick={() => setHeroLightboxOpen(true)}
                  aria-label={`View full image for ${post.title}`}
                >
                  <WritingImage
                    src={post.hero_image}
                    alt=""
                    crop={post.hero_image_crop}
                    wrapperClassName="modern-writing-hero__media"
                    className="modern-writing-hero__img"
                  />
                </button>
                {heroLightboxOpen ? (
                  <Suspense fallback={null}>
                    <Lightbox
                      isOpen={heroLightboxOpen}
                      onClose={() => setHeroLightboxOpen(false)}
                      imageUrl={resolveStoragePublicUrl(post.hero_image)}
                      imageAlt={post.title}
                    />
                  </Suspense>
                ) : null}
              </>
            ) : (
              <div className="modern-writing-hero">
                <WritingImage
                  src={post.hero_image}
                  alt=""
                  crop={post.hero_image_crop}
                  wrapperClassName="modern-writing-hero__media"
                  className="modern-writing-hero__img"
                />
              </div>
            )
          ) : null}

          <div className={showToc ? writingLayout.layoutWithToc : writingLayout.layout}>
            {showToc ? (
              <nav className={writingLayout.tocWrap} aria-label="Table of contents">
                <p className={writingLayout.tocTitle}>On this page</p>
                <ul className="list-none m-0 p-0">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className={writingLayout.tocLink}>
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <article className={writingArticleClass(post.layout)}>
              <header className={writingLayout.articleHeader}>
                <h1 className={writingLayout.articleTitle}>{post.title}</h1>
                {post.subtitle ? (
                  <p className={writingLayout.articleSubtitle}>{post.subtitle}</p>
                ) : null}
                <WritingPostMeta
                  author={authorName}
                  date={post.published_at ? formatDate(post.published_at) : undefined}
                  readingMinutes={readingMinutes}
                  topics={post.topics}
                />
              </header>

              <div className={writingLayout.proseWrap}>
                <WritingBlockRenderer
                  blocks={post.blocks}
                  caseStudies={caseStudies}
                  posts={writingPosts}
                />
              </div>

              <footer className={writingLayout.footerNav}>
                <button
                  type="button"
                  onClick={onBack}
                  style={{ ...modernFont, fontSize: '0.875rem', color: modern.muted, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ← All writing
                </button>
                {post.linkedin_url ? <WritingPostLinkedInLink url={post.linkedin_url} /> : null}
              </footer>

              {relatedPosts.length > 0 ? (
                <section className="modern-writing-related">
                  <h2 className="modern-writing-related__title">Related</h2>
                  <div className="modern-writing-card-grid">
                    {relatedPosts.map((rp) => (
                      <a key={rp.id} href={`/writing/${rp.slug}`} className="modern-writing-related__link">
                        {rp.title}
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          </div>
        </div>
      </section>
      <ModernFooter logoUrl={logoUrl} />
    </main>
  );
}
