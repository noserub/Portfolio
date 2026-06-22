import type { CSSProperties } from "react";
import type { ProjectData } from "../components/ProjectImage";

export type ImageCropFrame = {
  scale: number;
  position: { x: number; y: number };
};

function normalizeFrame(
  scale: unknown,
  position: { x?: unknown; y?: unknown } | undefined,
  fallback: ImageCropFrame,
): ImageCropFrame {
  const safeScale =
    typeof scale === "number" && Number.isFinite(scale) ? scale : fallback.scale;
  const x =
    typeof position?.x === "number" && Number.isFinite(position.x)
      ? position.x
      : fallback.position.x;
  const y =
    typeof position?.y === "number" && Number.isFinite(position.y)
      ? position.y
      : fallback.position.y;
  return { scale: safeScale, position: { x, y } };
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

/** Contain + CSS scale — smooth zoom without flipping to cover past 100%. */
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

export function projectCardImageStyle(
  project: Pick<ProjectData, "scale" | "position">,
): CSSProperties {
  const { scale, position } = getProjectCardFrame(project);
  return croppedImageStyle(scale, position);
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
