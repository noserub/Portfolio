import type { CSSProperties } from "react";
import type { ProjectData } from "../components/ProjectImage";

export type ImageCropFrame = {
  scale: number;
  position: { x: number; y: number };
};

function toCropNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeFrame(
  scale: unknown,
  position: { x?: unknown; y?: unknown } | undefined,
  fallback: ImageCropFrame,
): ImageCropFrame {
  const safeScale = toCropNumber(scale, fallback.scale);
  const x = toCropNumber(position?.x, fallback.position.x);
  const y = toCropNumber(position?.y, fallback.position.y);
  return {
    scale: safeScale > 0 ? safeScale : fallback.scale,
    position: {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    },
  };
}

const DEFAULT_FRAME: ImageCropFrame = { scale: 1, position: { x: 50, y: 50 } };

/** Card / home grid thumbnail crop (`projects.scale`, `position_x`, `position_y`). */
export function getProjectCardFrame(
  project: Pick<ProjectData, "scale" | "position">,
): ImageCropFrame {
  return normalizeFrame(project.scale, project.position, DEFAULT_FRAME);
}

/** Detail page hero crop; falls back to card crop until hero fields are saved. */
export function getProjectDetailHeroFrame(
  project: Pick<ProjectData, "scale" | "position" | "heroScale" | "heroPosition">,
): ImageCropFrame {
  const cardFrame = getProjectCardFrame(project);
  const hasHeroScale =
    typeof project.heroScale === "number" && Number.isFinite(project.heroScale);
  const hasHeroPosition =
    typeof project.heroPosition?.x === "number" &&
    typeof project.heroPosition?.y === "number";

  if (!hasHeroScale && !hasHeroPosition) {
    return cardFrame;
  }

  return normalizeFrame(
    hasHeroScale ? project.heroScale : cardFrame.scale,
    hasHeroPosition ? project.heroPosition : cardFrame.position,
    cardFrame,
  );
}

/** @deprecated Use getProjectCardFrame or getProjectDetailHeroFrame */
export function getProjectHeroFrame(
  project: Pick<ProjectData, "scale" | "position" | "heroScale" | "heroPosition">,
): ImageCropFrame {
  return getProjectDetailHeroFrame(project);
}

/** Contain + CSS scale — used for hero/detail and galleries where the full image may be shown. */
export function croppedImageStyle(
  scale: number,
  position: { x: number; y: number },
): CSSProperties {
  const safeScale = typeof scale === "number" && Number.isFinite(scale) ? scale : 1;
  const x = typeof position.x === "number" ? position.x : 50;
  const y = typeof position.y === "number" ? position.y : 50;
  return {
    objectFit: "contain",
    transform: `scale(${safeScale})`,
    transformOrigin: `${x}% ${y}%`,
  };
}

/** Contain + scale — full image visible at 100%; zoom in to fill the frame (classic card behavior). */
export function croppedCardImageStyle(
  scale: number,
  position: { x: number; y: number },
): CSSProperties {
  const safeScale = typeof scale === "number" && Number.isFinite(scale) ? scale : 1;
  const x = typeof position.x === "number" ? position.x : 50;
  const y = typeof position.y === "number" ? position.y : 50;
  const focal = `${x}% ${y}%`;
  return {
    objectFit: "contain",
    transform: `scale(${safeScale})`,
    transformOrigin: focal,
  };
}

/** Scale (contain mode) so the image fills the card frame with no letterboxing. */
export function computeCardFitToFrameScale(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return 1;
  }
  const imageAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;
  const scale =
    imageAspect > containerAspect
      ? imageAspect / containerAspect
      : containerAspect / imageAspect;
  return Math.max(0.5, Math.min(4, scale));
}

export const CARD_CROP_MIN_SCALE = 0.5;
export const CARD_CROP_MAX_SCALE = 4;

export function projectCardImageStyle(
  project: Pick<ProjectData, "scale" | "position">,
): CSSProperties {
  const { scale, position } = getProjectCardFrame(project);
  return croppedCardImageStyle(scale, position);
}

export function projectDetailHeroImageStyle(
  project: Pick<ProjectData, "scale" | "position" | "heroScale" | "heroPosition">,
): CSSProperties {
  const { scale, position } = getProjectDetailHeroFrame(project);
  return croppedImageStyle(scale, position);
}

/** @deprecated Use projectCardImageStyle or projectDetailHeroImageStyle */
export function projectHeroImageStyle(
  project: Pick<ProjectData, "scale" | "position" | "heroScale" | "heroPosition">,
): CSSProperties {
  return projectCardImageStyle(project);
}
