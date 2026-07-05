import { Plus } from 'lucide-react';
import { modernPrimaryButtonStyle } from '../../design/modernTokens';
import {
  WRITING_INDEX_GRID_OPTIONS,
  type WritingIndexGrid,
} from '../../lib/writingIndexGrid';

interface ModernWritingEditBarProps {
  onNewPost: () => void;
  creating?: boolean;
  indexGrid?: WritingIndexGrid;
  onIndexGridChange?: (grid: WritingIndexGrid) => void;
}

export function ModernWritingEditBar({
  onNewPost,
  creating = false,
  indexGrid,
  onIndexGridChange,
}: ModernWritingEditBarProps) {
  const activeGrid = indexGrid ?? 'double';
  const activeHint = WRITING_INDEX_GRID_OPTIONS.find((o) => o.value === activeGrid)?.hint;

  return (
    <div className="modern-writing-edit-bar">
      <div className="modern-writing-edit-bar__actions">
        {onIndexGridChange ? (
          <div className="modern-writing-index-grid-control" role="group" aria-label="Index layout">
            <span className="modern-writing-index-grid-control__label">Index layout</span>
            <div className="modern-writing-index-grid-control__options">
              {WRITING_INDEX_GRID_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`modern-writing-index-grid-control__option${
                    activeGrid === option.value
                      ? ' modern-writing-index-grid-control__option--active'
                      : ''
                  }`}
                  aria-pressed={activeGrid === option.value}
                  onClick={() => onIndexGridChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span aria-hidden="true" />
        )}

        <button
          type="button"
          className="modern-btn-primary modern-writing-edit-bar__new-post disabled:opacity-60"
          style={modernPrimaryButtonStyle}
          onClick={onNewPost}
          disabled={creating}
        >
          <Plus className="w-4 h-4" aria-hidden />
          {creating ? 'Creating…' : 'New post'}
        </button>
      </div>

      {activeHint && onIndexGridChange ? (
        <p className="modern-writing-layout-hint">{activeHint}</p>
      ) : null}
    </div>
  );
}
