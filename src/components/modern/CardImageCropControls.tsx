import { Maximize2, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { CARD_CROP_MAX_SCALE, CARD_CROP_MIN_SCALE } from "../../lib/projectHeroFrame";
import { Slider } from "../ui/slider";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface CardImageCropControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onFitToFrame: () => void;
  onReset: () => void;
  onDone: () => void;
  onCancel: () => void;
  /** Overlay sits on the image; inline sits below it in the card layout. */
  variant?: "inline" | "overlay";
}

/** Zoom / fit controls — WYSIWYG overlay on the card image or inline below it. */
export function CardImageCropControls({
  scale,
  onScaleChange,
  onFitToFrame,
  onReset,
  onDone,
  onCancel,
  variant = "inline",
}: CardImageCropControlsProps) {
  const pct = Math.round(scale * 100);
  const minPct = Math.round(CARD_CROP_MIN_SCALE * 100);
  const maxPct = Math.round(CARD_CROP_MAX_SCALE * 100);
  const isOverlay = variant === "overlay";

  return (
    <div
      className={`modern-card-crop-controls${isOverlay ? " modern-card-crop-controls--overlay" : ""}`}
      role="toolbar"
      aria-label="Card image crop controls"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {isOverlay ? (
        <div className="modern-card-crop-controls__overlay-hint" style={{ ...modernFont, color: modern.muted }}>
          <Move className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Drag image to reposition
        </div>
      ) : (
        <div className="modern-card-crop-controls__hint" style={{ ...modernFont, color: modern.muted }}>
          <Move className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Drag to reposition · 100% shows the full image · Fit to frame fills the card
        </div>
      )}
      <div className="modern-card-crop-controls__row">
        <button
          type="button"
          className="modern-card-crop-controls__icon-btn"
          onClick={() => onScaleChange(Math.max(CARD_CROP_MIN_SCALE, scale - 0.05))}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" aria-hidden />
        </button>
        <div className="modern-card-crop-controls__slider">
          <Slider
            value={[pct]}
            min={minPct}
            max={maxPct}
            step={1}
            onValueChange={(values) => onScaleChange(values[0] / 100)}
            aria-label="Zoom level"
          />
        </div>
        <button
          type="button"
          className="modern-card-crop-controls__icon-btn"
          onClick={() => onScaleChange(Math.min(CARD_CROP_MAX_SCALE, scale + 0.05))}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" aria-hidden />
        </button>
        <span className="modern-card-crop-controls__pct" style={modernFont}>
          {pct}%
        </span>
      </div>
      <div className="modern-card-crop-controls__actions">
        <button type="button" className="modern-btn-outline modern-card-crop-controls__btn" style={modernFont} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="modern-card-crop-controls__reset" style={modernFont} onClick={onFitToFrame}>
          <Maximize2 className="w-3.5 h-3.5" aria-hidden />
          Fit
        </button>
        <button type="button" className="modern-card-crop-controls__reset" style={modernFont} onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          Reset
        </button>
        <button
          type="button"
          className="modern-btn-primary modern-card-crop-controls__btn"
          style={modernPrimaryButtonStyle}
          onClick={onDone}
        >
          Save
        </button>
      </div>
    </div>
  );
}
