import { modernLayout } from './modernLayout';
import type { WritingLayout } from '../types/writingBlocks';

/** Writing page class names — styles live in design/tokens/modern.css */
export const writingLayout = {
  shell: `${modernLayout.sectionX} ${modernLayout.heroPt} modern-writing-index-shell`,
  indexHero: 'modern-writing-index-hero',
  indexTitle: 'modern-writing-index-title',
  indexLead: 'modern-writing-index-lead',
  cardGrid: 'modern-writing-card-grid modern-writing-card-grid--double',
  cardWrap: 'modern-writing-card-wrap',
  card: 'modern-writing-card',
  cardActions: 'modern-writing-card-actions',
  cardTitle: 'modern-writing-card__title',
  cardExcerpt: 'modern-writing-card__excerpt',
  filterRow: 'modern-writing-filter-row',
  filterChip: 'modern-writing-filter-chip',
  filterChipActive: 'modern-writing-filter-chip--active',
  back: 'modern-writing-back',
  layoutWithToc: 'modern-writing-layout modern-writing-layout--with-toc',
  layout: 'modern-writing-layout',
  tocWrap: 'modern-writing-toc',
  tocTitle: 'modern-writing-toc__title',
  tocLink: 'modern-writing-toc__link',
  articleWrap: 'modern-writing-article modern-writing-article--essay',
  articleWrapMagazine: 'modern-writing-article modern-writing-article--magazine',
  articleWrapNote: 'modern-writing-article modern-writing-article--note',
  articlePreview: 'modern-writing-article-preview',
  articleHeader: 'modern-writing-article__header',
  articleTitle: 'modern-writing-article__title',
  articleSubtitle: 'modern-writing-article__subtitle',
  proseWrap: 'modern-writing-prose',
  pullQuote: 'modern-writing-pull-quote',
  pullQuoteAttr: '',
  figureInline: 'modern-writing-figure',
  figureFullBleed: 'modern-writing-figure modern-writing-figure--bleed',
  figureCaption: 'modern-writing-figure__caption',
  relatedCard: 'modern-writing-related-card',
  footerNav: 'modern-writing-footer-nav',
  linkedinLink: 'modern-writing-linkedin',
  empty: 'modern-writing-empty',
  draftBadge: 'modern-writing-draft-badge',
} as const;

export function writingArticleClass(layout: WritingLayout): string {
  switch (layout) {
    case 'magazine':
      return writingLayout.articleWrapMagazine;
    case 'note':
      return writingLayout.articleWrapNote;
    default:
      return writingLayout.articleWrap;
  }
}
