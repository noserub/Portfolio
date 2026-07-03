export interface AtmosphereDot {
  x: number;
  y: number;
  phase: number;
  depth: number;
  accent: boolean;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface NebulaPalette {
  core: string;
  wash: string;
  whisper: string;
  /** Complementary cyan/azure accent for pointer-reactive pops. */
  spark: string;
}

export interface NebulaGlowMotion {
  coreX: number;
  coreY: number;
  washX: number;
  washY: number;
  whisperX: number;
  whisperY: number;
  washMix: number;
  whisperMix: number;
  pulse: number;
}

/** Normalized hero pointer state, smoothed in the render loop. */
export interface AtmospherePointerInfluence {
  active: number;
  x: number;
  y: number;
}

const CLUSTER_X = 0.72;
const CLUSTER_Y = 0.5;

/** Slightly more visible drift than the original 0.012 field. */
export const ATMOSPHERE_DRIFT_AMPLITUDE = 0.018;

/** Global ambient speed. Lower values slow breath, drift, and nebula phases. */
export const ATMOSPHERE_ANIMATION_SPEED = 0.82;

/** Same pixel ramp below nav border and above section bottom border. */
export const ATMOSPHERE_FEATHER_PX = 72;

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface AtmosphereEdgeStops {
  featherNorm: number;
  navNorm: number;
}

export function atmosphereEdgeStops(heightPx: number, navHeightPx: number): AtmosphereEdgeStops {
  const featherNorm = Math.min(0.14, ATMOSPHERE_FEATHER_PX / Math.max(1, heightPx));
  const navNorm = Math.min(1 - featherNorm * 2, navHeightPx / Math.max(1, heightPx));
  return { featherNorm, navNorm };
}

export function buildAtmosphereDots(): AtmosphereDot[] {
  const cols = 48;
  const rows = 40;
  const dots: AtmosphereDot[] = [];
  let seed = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nx = col / (cols - 1);
      const ny = row / (rows - 1);

      const rightBias = 0.35 + nx * 0.65;
      if (pseudoRandom(seed++) > rightBias) continue;

      const jitterX = (pseudoRandom(seed++) - 0.5) * 0.028;
      const jitterY = (pseudoRandom(seed++) - 0.5) * 0.028;
      const x = 0.02 + nx * 0.96 + jitterX;
      const y = -0.06 + ny * 1.12 + jitterY;

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
  const t = elapsed * ATMOSPHERE_ANIMATION_SPEED;
  return 0.5 + 0.5 * Math.sin(t * 0.12);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const n = Number.parseInt(normalized, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function withAlphaHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function blendHex(a: string, b: string, t: number): string {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return a;
  const mix = Math.max(0, Math.min(1, t));
  return rgbToHex({
    r: lerp(rgbA.r, rgbB.r, mix),
    g: lerp(rgbA.g, rgbB.g, mix),
    b: lerp(rgbA.b, rgbB.b, mix),
  });
}

/** Analogous teal/cyan washes plus a distinct azure spark derived from the brand accent. */
export function deriveNebulaPalette(accentHex: string): NebulaPalette {
  const core = accentHex.trim() || "#84bd00";
  const rgb = hexToRgb(core);
  if (!rgb) {
    return { core, wash: "#1a6b58", whisper: "#1a4d6b", spark: "#2a8ec8" };
  }

  const wash = {
    r: rgb.r * 0.22,
    g: rgb.g * 0.68,
    b: rgb.b * 0.42 + 88,
  };
  const whisper = {
    r: rgb.r * 0.12,
    g: rgb.g * 0.42,
    b: rgb.b * 0.2 + 108,
  };
  const spark = {
    r: rgb.r * 0.08 + 38,
    g: rgb.g * 0.28 + 52,
    b: rgb.b * 0.05 + 198,
  };

  return {
    core,
    wash: rgbToHex(wash),
    whisper: rgbToHex(whisper),
    spark: rgbToHex(spark),
  };
}

/** How strongly the azure spark tints the nebula based on pointer position. */
export function atmospherePointerSparkWeight(pointer: AtmospherePointerInfluence): number {
  if (pointer.active <= 0.001) return 0;
  const rightBias = Math.max(0, Math.min(1, (pointer.x - 0.28) * 1.35));
  const verticalBias = 1 - Math.min(1, Math.abs(pointer.y - 0.52) * 1.15);
  return pointer.active * rightBias * verticalBias;
}

/** Gently pull glow layers toward the cursor while the hero is hovered. */
export function applyPointerToMotion(
  motion: NebulaGlowMotion,
  pointer: AtmospherePointerInfluence,
): NebulaGlowMotion {
  const sparkWeight = atmospherePointerSparkWeight(pointer);
  if (sparkWeight <= 0.001) return motion;

  const pull = sparkWeight * 0.07;
  const dx = (pointer.x - motion.coreX) * pull;
  const dy = (pointer.y - motion.coreY) * pull * 0.75;

  return {
    ...motion,
    coreX: motion.coreX + dx,
    coreY: motion.coreY + dy,
    washX: motion.washX + dx * 0.85,
    washY: motion.washY + dy * 0.85,
    whisperX: motion.whisperX + dx * 0.55,
    whisperY: motion.whisperY + dy * 0.55,
    washMix: Math.min(1, motion.washMix + sparkWeight * 0.1),
    whisperMix: Math.min(1, motion.whisperMix + sparkWeight * 0.12),
    pulse: Math.min(1, motion.pulse + sparkWeight * 0.05),
  };
}

/**
 * Soft particle repulsion around the cursor — depth-aware so nearer dots shift more.
 * Returns normalized offsets added after cluster + ambient drift.
 */
export function atmospherePointerParticleOffset(
  dotX: number,
  dotY: number,
  depth: number,
  pointer: AtmospherePointerInfluence,
): { dx: number; dy: number } {
  const sparkWeight = atmospherePointerSparkWeight(pointer);
  if (sparkWeight <= 0.001) return { dx: 0, dy: 0 };

  const offsetX = dotX - pointer.x;
  const offsetY = dotY - pointer.y;
  const distance = Math.hypot(offsetX, offsetY);
  const influenceRadius = 0.24;

  if (distance >= influenceRadius) return { dx: 0, dy: 0 };

  const falloff = 1 - distance / influenceRadius;
  const eased = falloff * falloff * (3 - 2 * falloff);
  const strength = sparkWeight * eased * (0.022 + depth * 0.016);

  if (distance <= 0.0001) {
    return { dx: strength * 0.35, dy: 0 };
  }

  return {
    dx: (offsetX / distance) * strength,
    dy: (offsetY / distance) * strength,
  };
}

/** Layer offsets and slow color-mix phases for the nebula glow stack. */
export function atmosphereNebulaMotion(elapsed: number, reducedMotion: boolean): NebulaGlowMotion {
  if (reducedMotion) {
    return {
      coreX: 0.68,
      coreY: 0.5,
      washX: 0.62,
      washY: 0.44,
      whisperX: 0.76,
      whisperY: 0.56,
      washMix: 0.62,
      whisperMix: 0.48,
      pulse: 0.72,
    };
  }

  const t = elapsed * ATMOSPHERE_ANIMATION_SPEED;
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.62);

  return {
    coreX: 0.68 + Math.sin(t * 0.11) * 0.018,
    coreY: 0.5 + Math.cos(t * 0.09) * 0.022,
    washX: 0.61 + Math.sin(t * 0.07 + 1.2) * 0.045,
    washY: 0.44 + Math.cos(t * 0.06 + 0.4) * 0.05,
    whisperX: 0.77 + Math.cos(t * 0.05 + 2.1) * 0.038,
    whisperY: 0.57 + Math.sin(t * 0.048 + 1.8) * 0.042,
    washMix: 0.5 + 0.5 * Math.sin(t * 0.14),
    whisperMix: 0.5 + 0.5 * Math.cos(t * 0.11 + 0.8),
    pulse,
  };
}

/** Fade dots under left copy — higher floor so field reads on low-contrast displays. */
export function atmosphereReadabilityAlpha(x: number, width: number): number {
  const nx = x / width;
  if (nx <= 0.22) return 0.12;
  if (nx >= 0.5) return 1;
  return 0.12 + ((nx - 0.22) / 0.28) * 0.88;
}

/** Horizontal cluster only — keep vertical spread so dots can bleed to both dividers. */
export function clusterPosition(
  x: number,
  y: number,
  breath: number,
): { x: number; y: number } {
  const pullX = 0.12 + breath * 0.22;
  const pullY = 0.025 + breath * 0.065;
  return {
    x: x + (CLUSTER_X - x) * pullX,
    y: y + (CLUSTER_Y - y) * pullY,
  };
}

/**
 * Match the visible top edge (nav border) on the bottom edge (section border):
 * short equal ramps in px — not a tall % band that eats the bottom padding.
 */
export function atmosphereVerticalEdgeAlpha(
  normalizedY: number,
  heightPx: number,
  navHeightPx: number,
): number {
  const y = Math.max(0, Math.min(1, normalizedY));
  const { featherNorm, navNorm } = atmosphereEdgeStops(heightPx, navHeightPx);

  if (y <= navNorm) return 0;
  if (y < navNorm + featherNorm) return (y - navNorm) / featherNorm;
  if (y > 1 - featherNorm) return (1 - y) / featherNorm;
  return 1;
}

export function atmosphereVerticalEdgeMaskGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  navHeightPx: number,
): CanvasGradient {
  const { featherNorm, navNorm } = atmosphereEdgeStops(height, navHeightPx);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(navNorm, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(Math.min(1, navNorm + featherNorm), "rgba(0, 0, 0, 1)");
  gradient.addColorStop(Math.max(navNorm + featherNorm, 1 - featherNorm), "rgba(0, 0, 0, 1)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  return gradient;
}
