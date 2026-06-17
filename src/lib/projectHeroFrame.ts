import type { CSSProperties } from "react";
import type { ProjectData } from "../components/ProjectImage";

/** Normalized hero crop frame shared by home cards and case study detail hero. */
export function getProjectHeroFrame(project: Pick<ProjectData, "scale" | "position">) {
  const scale = typeof project.scale === "number" && Number.isFinite(project.scale) ? project.scale : 1;
  const x = typeof project.position?.x === "number" ? project.position.x : 50;
  const y = typeof project.position?.y === "number" ? project.position.y : 50;
  return { scale, position: { x, y } };
}

export function projectHeroImageStyle(
  project: Pick<ProjectData, "scale" | "position">,
): CSSProperties {
  const { scale, position } = getProjectHeroFrame(project);
  return {
    objectFit: "contain",
    transform: `scale(${scale})`,
    transformOrigin: `${position.x}% ${position.y}%`,
  };
}
