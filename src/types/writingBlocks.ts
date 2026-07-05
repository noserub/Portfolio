import type { ImageCropFrame } from '../lib/writingImageFrame';

export type WritingLayout = 'essay' | 'magazine' | 'note';

export type FigureLayout = 'inline' | 'fullBleed';

export type RelatedLinkType = 'case_study' | 'post';

export interface WritingBlockBase {
  id: string;
  visible: boolean;
}

export interface ProseBlock extends WritingBlockBase {
  type: 'prose';
  content: string;
}

export interface PullQuoteBlock extends WritingBlockBase {
  type: 'pull_quote';
  text: string;
  attribution?: string;
}

export interface FigureBlock extends WritingBlockBase {
  type: 'figure';
  url: string;
  alt: string;
  caption?: string;
  layout: FigureLayout;
  crop?: ImageCropFrame | null;
  /** When true, readers can click the figure to open a full-size lightbox. */
  lightbox?: boolean;
}

export interface RelatedBlock extends WritingBlockBase {
  type: 'related';
  linkType: RelatedLinkType;
  targetId: string;
  label?: string;
}

export type WritingBlock = ProseBlock | PullQuoteBlock | FigureBlock | RelatedBlock;

export type WritingBlockType = WritingBlock['type'];

export const WRITING_BLOCK_TYPES: WritingBlockType[] = [
  'prose',
  'pull_quote',
  'figure',
  'related',
];

export function createWritingBlock(type: WritingBlockType): WritingBlock {
  const id = `wb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case 'prose':
      return { id, type: 'prose', content: '', visible: true };
    case 'pull_quote':
      return { id, type: 'pull_quote', text: '', visible: true };
    case 'figure':
      return {
        id,
        type: 'figure',
        url: '',
        alt: '',
        caption: '',
        layout: 'inline',
        lightbox: false,
        visible: true,
      };
    case 'related':
      return {
        id,
        type: 'related',
        linkType: 'post',
        targetId: '',
        label: '',
        visible: true,
      };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function parseWritingBlocks(raw: unknown): WritingBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isWritingBlock);
}

function isWritingBlock(value: unknown): value is WritingBlock {
  if (!value || typeof value !== 'object') return false;
  const block = value as Record<string, unknown>;
  if (typeof block.id !== 'string' || typeof block.visible !== 'boolean') return false;
  switch (block.type) {
    case 'prose':
      return typeof block.content === 'string';
    case 'pull_quote':
      return typeof block.text === 'string';
    case 'figure':
      if (
        typeof block.url !== 'string' ||
        typeof block.alt !== 'string' ||
        (block.layout !== 'inline' && block.layout !== 'fullBleed')
      ) {
        return false;
      }
      if (block.crop != null && typeof block.crop !== 'object') return false;
      if (block.lightbox != null && typeof block.lightbox !== 'boolean') return false;
      return true;
    case 'related':
      return (
        (block.linkType === 'case_study' || block.linkType === 'post') &&
        typeof block.targetId === 'string'
      );
    default:
      return false;
  }
}
