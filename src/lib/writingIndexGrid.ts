export type WritingIndexGrid = 'single' | 'double' | 'editorial';

export const WRITING_INDEX_GRID_OPTIONS: {
  value: WritingIndexGrid;
  label: string;
  hint: string;
}[] = [
  {
    value: 'single',
    label: 'Single',
    hint: 'One column at all breakpoints. Best for long titles or fewer posts.',
  },
  {
    value: 'double',
    label: 'Two-up',
    hint: 'Two columns from tablet up. Default, balanced scan pattern.',
  },
  {
    value: 'editorial',
    label: 'Featured',
    hint: 'Latest post spans full width; the rest stay two-up. Not a masonry waterfall.',
  },
];

export function parseWritingIndexGrid(value: unknown): WritingIndexGrid {
  if (value === 'single' || value === 'double' || value === 'editorial') {
    return value;
  }
  return 'double';
}

export function writingIndexGridClass(mode: WritingIndexGrid): string {
  return `modern-writing-card-grid modern-writing-card-grid--${mode}`;
}
