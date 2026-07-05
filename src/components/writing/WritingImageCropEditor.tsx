import { useCallback, useRef, useState } from 'react';
import { Crop } from 'lucide-react';
import { Button } from '../ui/button';
import { CardImageCropControls } from '../modern/CardImageCropControls';
import {
  computeCardFitToFrameScale,
  type ImageCropFrame,
} from '../../lib/projectHeroFrame';
import {
  defaultWritingImageCrop,
  getWritingImageFrame,
  writingCroppedImageStyle,
} from '../../lib/writingImageFrame';
import { resolveStoragePublicUrl } from '../../utils/imageOptimizer';

export type WritingCropPreviewVariant = 'card' | 'hero' | 'figure-inline' | 'figure-bleed';

const PREVIEW_CLASS: Record<WritingCropPreviewVariant, string> = {
  card: 'modern-writing-crop-preview modern-writing-crop-preview--card',
  hero: 'modern-writing-crop-preview modern-writing-crop-preview--hero',
  'figure-inline': 'modern-writing-crop-preview modern-writing-crop-preview--figure-inline',
  'figure-bleed': 'modern-writing-crop-preview modern-writing-crop-preview--figure-bleed',
};

interface WritingImageCropEditorProps {
  src: string;
  crop: ImageCropFrame | null | undefined;
  onCropChange: (crop: ImageCropFrame | null) => void;
  previewVariant?: WritingCropPreviewVariant;
  disabled?: boolean;
}

export function WritingImageCropEditor({
  src,
  crop,
  onCropChange,
  previewVariant = 'figure-inline',
  disabled = false,
}: WritingImageCropEditorProps) {
  const [isCropping, setIsCropping] = useState(false);
  const [draft, setDraft] = useState<ImageCropFrame>(() => getWritingImageFrame(crop));
  const previewRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const frame = isCropping ? draft : getWritingImageFrame(crop);
  const resolvedSrc = resolveStoragePublicUrl(src);

  const handleStartCrop = () => {
    setDraft(getWritingImageFrame(crop));
    setIsCropping(true);
  };

  const handleCancel = () => {
    setDraft(getWritingImageFrame(crop));
    setIsCropping(false);
  };

  const handleDone = () => {
    onCropChange(draft);
    setIsCropping(false);
  };

  const handleReset = () => {
    setDraft(defaultWritingImageCrop());
  };

  const handleFitToFrame = useCallback(() => {
    const container = previewRef.current;
    if (!container) return;

    const applyFit = (img: HTMLImageElement) => {
      const rect = container.getBoundingClientRect();
      const scale = computeCardFitToFrameScale(
        rect.width,
        rect.height,
        img.naturalWidth,
        img.naturalHeight,
      );
      setDraft({ scale, position: { x: 50, y: 50 } });
    };

    const img = container.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      applyFit(img);
      return;
    }
    img.addEventListener('load', () => applyFit(img), { once: true });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCropping) return;
    e.preventDefault();
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isCropping || !draggingRef.current || !previewRef.current) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setDraft((prev) => ({ ...prev, position: { x, y } }));
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="modern-writing-crop-editor space-y-2">
      <div
        ref={previewRef}
        className={`${PREVIEW_CLASS[previewVariant]}${isCropping ? ' modern-writing-crop-preview--active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <img
          src={resolvedSrc}
          alt=""
          className="modern-writing-crop-preview__img"
          style={writingCroppedImageStyle(frame)}
          draggable={false}
        />
        {isCropping ? (
          <CardImageCropControls
            variant="overlay"
            scale={frame.scale}
            onScaleChange={(scale) => setDraft((prev) => ({ ...prev, scale }))}
            onFitToFrame={handleFitToFrame}
            onReset={handleReset}
            onDone={handleDone}
            onCancel={handleCancel}
          />
        ) : null}
      </div>

      {!isCropping ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleStartCrop}
        >
          <Crop className="w-3.5 h-3.5 mr-1.5" aria-hidden />
          Adjust framing
        </Button>
      ) : null}

      <p className="modern-writing-layout-hint">
        Drag to reposition the focal point. Zoom in to show part of the image (useful for text overlays on index cards or banners).
      </p>
    </div>
  );
}
