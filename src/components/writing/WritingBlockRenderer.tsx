import { ArrowRight, ExternalLink } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { WritingImage } from './WritingImage';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { writingLayout } from '../../design/writingLayout';
import type { WritingBlock } from '../../types/writingBlocks';
import { slugFromProjectTitle } from '../../lib/projectSlug';
import { resolveStoragePublicUrl } from '../../utils/imageOptimizer';

const Lightbox = lazy(() =>
  import('../Lightbox').then((m) => ({ default: m.default })),
);

type FigureLightboxState = {
  url: string;
  alt: string;
  caption?: string;
};

export interface RelatedLinkTarget {
  id: string;
  title: string;
  slug?: string;
}

export interface WritingBlockRendererProps {
  blocks: WritingBlock[];
  caseStudies?: RelatedLinkTarget[];
  posts?: RelatedLinkTarget[];
}

function resolveRelatedHref(
  block: Extract<WritingBlock, { type: 'related' }>,
  caseStudies: RelatedLinkTarget[],
  posts: RelatedLinkTarget[],
): { href: string; title: string } | null {
  if (block.linkType === 'case_study') {
    const match = caseStudies.find((p) => p.id === block.targetId);
    if (!match) return null;
    const slug = match.slug || slugFromProjectTitle(match.title);
    return { href: `/project/${slug}`, title: block.label || match.title };
  }
  const match = posts.find((p) => p.id === block.targetId);
  if (!match) return null;
  const slug = match.slug || '';
  return { href: `/writing/${slug}`, title: block.label || match.title };
}

export function WritingBlockRenderer({
  blocks,
  caseStudies = [],
  posts = [],
}: WritingBlockRendererProps) {
  const visible = blocks.filter((b) => b.visible);
  const [figureLightbox, setFigureLightbox] = useState<FigureLightboxState | null>(null);

  const renderFigureImage = (block: Extract<WritingBlock, { type: 'figure' }>) => {
    const mediaClassName =
      block.layout === 'fullBleed'
        ? 'modern-writing-figure__media modern-writing-figure__media--bleed'
        : 'modern-writing-figure__media';
    const imgClassName =
      block.layout === 'fullBleed'
        ? 'modern-writing-figure__img modern-writing-figure__img--bleed'
        : 'modern-writing-figure__img';

    const image = (
      <WritingImage
        src={block.url}
        alt={block.alt || ''}
        crop={block.crop}
        wrapperClassName={mediaClassName}
        className={imgClassName}
      />
    );

    if (!block.lightbox) return image;

    const label = block.alt.trim() || block.caption?.trim() || 'View full image';
    return (
      <button
        type="button"
        className="modern-writing-figure__trigger"
        onClick={() =>
          setFigureLightbox({
            url: block.url,
            alt: block.alt.trim() || block.caption?.trim() || 'Figure',
            caption: block.caption?.trim() || undefined,
          })
        }
        aria-label={label}
      >
        {image}
      </button>
    );
  };

  return (
    <div className={writingLayout.proseWrap}>
      {visible.map((block) => {
        switch (block.type) {
          case 'prose':
            if (!block.content.trim()) return null;
            return (
              <div key={block.id}>
                <MarkdownRenderer content={block.content} variant="writing" />
              </div>
            );
          case 'pull_quote':
            if (!block.text.trim()) return null;
            return (
              <blockquote key={block.id} className={writingLayout.pullQuote}>
                {block.text}
                {block.attribution ? (
                  <cite className={writingLayout.pullQuoteAttr}>{block.attribution}</cite>
                ) : null}
              </blockquote>
            );
          case 'figure':
            if (!block.url.trim()) return null;
            return (
              <figure
                key={block.id}
                className={
                  block.layout === 'fullBleed'
                    ? writingLayout.figureFullBleed
                    : writingLayout.figureInline
                }
              >
                {renderFigureImage(block)}
                {block.caption ? (
                  <figcaption className={writingLayout.figureCaption}>{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          case 'related': {
            const resolved = resolveRelatedHref(block, caseStudies, posts);
            if (!resolved) return null;
            return (
              <a key={block.id} href={resolved.href} className={writingLayout.relatedCard}>
                <span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                    Related
                  </span>
                  <span className="font-medium text-foreground">{resolved.title}</span>
                </span>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </a>
            );
          }
          default:
            return null;
        }
      })}
      {figureLightbox ? (
        <Suspense fallback={null}>
          <Lightbox
            isOpen={Boolean(figureLightbox)}
            onClose={() => setFigureLightbox(null)}
            imageUrl={resolveStoragePublicUrl(figureLightbox.url)}
            imageAlt={figureLightbox.alt}
            imageCaption={figureLightbox.caption}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export function WritingPostLinkedInLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={writingLayout.linkedinLink}
    >
      Discussed on LinkedIn
      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
    </a>
  );
}
