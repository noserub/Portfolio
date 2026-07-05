import type { CSSProperties } from 'react';
import {
  croppedCardImageStyle,
  type ImageCropFrame,
} from './projectHeroFrame';

export type { ImageCropFrame };

const DEFAULT_FRAME: ImageCropFrame = { scale: 1, position: { x: 50, y: 50 } };

function toCropNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function parseWritingImageCrop(raw: unknown): ImageCropFrame | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const positionRaw = value.position;
  const position =
    positionRaw && typeof positionRaw === 'object'
      ? (positionRaw as Record<string, unknown>)
      : null;
  return {
    scale: Math.max(0.5, Math.min(4, toCropNumber(value.scale, 1))),
    position: {
      x: Math.max(0, Math.min(100, toCropNumber(position?.x, 50))),
      y: Math.max(0, Math.min(100, toCropNumber(position?.y, 50))),
    },
  };
}

export function getWritingImageFrame(crop: ImageCropFrame | null | undefined): ImageCropFrame {
  if (!crop) return DEFAULT_FRAME;
  return parseWritingImageCrop(crop) ?? DEFAULT_FRAME;
}

export function writingCroppedImageStyle(crop: ImageCropFrame | null | undefined): CSSProperties {
  const frame = getWritingImageFrame(crop);
  return croppedCardImageStyle(frame.scale, frame.position);
}

export function defaultWritingImageCrop(): ImageCropFrame {
  return { ...DEFAULT_FRAME, position: { ...DEFAULT_FRAME.position } };
}

export function serializeWritingImageCrop(crop: ImageCropFrame | null | undefined): ImageCropFrame | null {
  if (!crop) return null;
  const parsed = parseWritingImageCrop(crop);
  if (!parsed) return null;
  const isDefault =
    parsed.scale === 1 && parsed.position.x === 50 && parsed.position.y === 50;
  return isDefault ? null : parsed;
}
