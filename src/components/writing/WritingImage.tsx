import type { CSSProperties } from 'react';
import { resolveStoragePublicUrl } from '../../utils/imageOptimizer';
import type { ImageCropFrame } from '../../lib/writingImageFrame';
import { getWritingImageFrame, writingCroppedImageStyle } from '../../lib/writingImageFrame';

interface WritingImageProps {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  crop?: ImageCropFrame | null;
  loading?: 'lazy' | 'eager';
  style?: CSSProperties;
}

export function WritingImage({
  src,
  alt = '',
  className,
  wrapperClassName,
  crop,
  loading = 'lazy',
  style,
}: WritingImageProps) {
  if (!src.trim()) return null;

  const frame = getWritingImageFrame(crop);
  const imgStyle: CSSProperties = {
    ...writingCroppedImageStyle(frame),
    ...style,
  };

  const img = (
    <img
      src={resolveStoragePublicUrl(src)}
      alt={alt}
      className={className}
      loading={loading}
      style={imgStyle}
      draggable={false}
    />
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{img}</div>;
  }

  return img;
}
