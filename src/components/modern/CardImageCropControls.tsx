import { Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "../ui/slider";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface CardImageCropControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
  onDone: () => void;
  onCancel: () => void;
}

/** Zoom / reset controls that sit below the card image — never overlay the crop area. */
export function CardImageCropControls({
  scale,
  onScaleChange,
  onReset,
  onDone,
  onCancel,
}: CardImageCropControlsProps) {
  const pct = Math.round(scale * 100);

  return (
    <div className="modern-card-crop-controls" role="toolbar" aria-label="Card image crop controls">
      <div className="modern-card-crop-controls__row">
        <button
          type="button"
          className="modern-card-crop-controls__icon-btn"
          onClick={() => onScaleChange(Math.max(0.5, scale - 0.05))}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" aria-hidden />
        </button>
        <div className="modern-card-crop-controls__slider">
          <Slider
            value={[pct]}
            min={50}
            max={200}
            step={1}
            onValueChange={(values) => onScaleChange(values[0] / 100)}
            aria-label="Zoom level"
          />
        </div>
        <button
          type="button"
          className="modern-card-crop-controls__icon-btn"
          onClick={() => onScaleChange(Math.min(2, scale + 0.05))}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" aria-hidden />
        </button>
        <span className="modern-card-crop-controls__pct" style={modernFont}>
          {pct}%
        </span>
      </div>
      <div className="modern-card-crop-controls__hint" style={{ ...modernFont, color: modern.muted }}>
        <Move className="w-3.5 h-3.5 shrink-0" aria-hidden />
        Drag the image to reposition
      </div>
      <div className="modern-card-crop-controls__actions">
        <button type="button" className="modern-btn-outline modern-card-crop-controls__btn" style={modernFont} onClick={onCancel}>
          Cancel
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
          Done
        </button>
      </div>
    </div>
  );
}
