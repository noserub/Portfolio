export interface AtmosphereDot {
  x: number;
  y: number;
  phase: number;
  depth: number;
  accent: boolean;
}

const CLUSTER_X = 0.72;
const CLUSTER_Y = 0.5;

/** Fraction of canvas height for symmetric bleed ramps at top/bottom dividers. */
export const ATMOSPHERE_EDGE_FEATHER = 0.12;

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function buildAtmosphereDots(): AtmosphereDot[] {
  const cols = 48;
  const rows = 30;
  const dots: AtmosphereDot[] = [];
  let seed = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nx = col / (cols - 1);
      const ny = row / (rows - 1);

      const rightBias = 0.35 + nx * 0.65;
      if (pseudoRandom(seed++) > rightBias) continue;

      const jitterX = (pseudoRandom(seed++) - 0.5) * 0.024;
      const jitterY = (pseudoRandom(seed++) - 0.5) * 0.024;
      const x = 0.03 + nx * 0.94 + jitterX;
      const y = 0.01 + ny * 0.98 + jitterY;

      dots.push({
        x,
        y,
        phase: pseudoRandom(seed++) * Math.PI * 2,
        depth: pseudoRandom(seed++) * 0.6 + 0.4,
        accent: pseudoRandom(seed++) > 0.92,
      });
    }
  }

  return dots;
}

/** Slow breath: 0 = scatter, 1 = soft cluster pull. */
export function atmosphereClusterBreath(elapsed: number): number {
  return 0.5 + 0.5 * Math.sin(elapsed * 0.1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Fade dots under left copy — higher floor so field reads on low-contrast displays. */
export function atmosphereReadabilityAlpha(x: number, width: number): number {
  const nx = x / width;
  if (nx <= 0.22) return 0.12;
  if (nx >= 0.5) return 1;
  return 0.12 + ((nx - 0.22) / 0.28) * 0.88;
}

export function clusterPosition(
  x: number,
  y: number,
  breath: number,
): { x: number; y: number } {
  const pull = 0.1 + breath * 0.18;
  return {
    x: x + (CLUSTER_X - x) * pull,
    y: y + (CLUSTER_Y - y) * pull,
  };
}

/**
 * Symmetric bleed into the top (nav border) and bottom (section border) dividers.
 * Ramps use the same depth on both edges; only the anchor Y differs (nav line vs section bottom).
 */
export function atmosphereVerticalEdgeAlpha(
  normalizedY: number,
  canvasHeightPx: number,
  navHeightPx: number,
): number {
  const y = Math.max(0, Math.min(1, normalizedY));
  if (canvasHeightPx <= 0) return 1;

  const navYNorm = Math.min(1, navHeightPx / canvasHeightPx);
  const feather = ATMOSPHERE_EDGE_FEATHER;

  if (y < navYNorm + feather) {
    if (y <= navYNorm) return 0;
    return (y - navYNorm) / feather;
  }

  if (y > 1 - feather) return (1 - y) / feather;

  return 1;
}

export function atmosphereVerticalEdgeMaskGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  navHeightPx: number,
): CanvasGradient {
  const navNorm = Math.min(1, navHeightPx / Math.max(1, height));
  const feather = ATMOSPHERE_EDGE_FEATHER;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(navNorm, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(Math.min(1, navNorm + feather), "rgba(0, 0, 0, 1)");
  gradient.addColorStop(Math.max(navNorm + feather, 1 - feather), "rgba(0, 0, 0, 1)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  return gradient;
}
