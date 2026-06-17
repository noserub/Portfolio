import type { CSSProperties } from "react";
import type { ProjectData } from "../components/ProjectImage";

/** Normalized hero crop frame shared by home cards and case study detail hero. */
export function getProjectHeroFrame(project: Pick<ProjectData, "scale" | "position">) {
  const scale = typeof project.scale === "number" && Number.isFinite(project.scale) ? project.scale : 1;
  const x = typeof project.position?.x === "number" ? project.position.x : 50;
  const y = typeof project.position?.y === "number" ? project.position.y : 50;
  return { scale, position: { x, y } };
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

export function projectHeroImageStyle(
  project: Pick<ProjectData, "scale" | "position">,
): CSSProperties {
  const { scale, position } = getProjectHeroFrame(project);
  return croppedImageStyle(scale, position);
}
