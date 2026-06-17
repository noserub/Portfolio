/** Portfolio surface + accent values (modern editorial palette). */
export const PORTFOLIO_ACCENT = "#84bd00";
export const PORTFOLIO_ACCENT_BRIGHT = "#95d004";
export const PORTFOLIO_ACCENT_DIM = "#6a8f00";
export const PORTFOLIO_ACCENT_SOFT = "#a3d419";
export const PORTFOLIO_SURFACE = "#141414";
export const PORTFOLIO_BG = "#0a0a0a";
export const PORTFOLIO_OLIVE = "#111408";
export const PORTFOLIO_SURFACE_MID = "#111111";

/** Letterbox behind contain-fit images — neutral grays only (no brand hue). */
export const PORTFOLIO_IMAGE_WELL_GRADIENT = `linear-gradient(180deg, ${PORTFOLIO_SURFACE} 0%, ${PORTFOLIO_SURFACE_MID} 55%, ${PORTFOLIO_BG} 100%)`;

export const PORTFOLIO_IMAGE_WELL_GRADIENT_LIGHT =
  "linear-gradient(165deg, #f4f4f5 0%, #eef2e6 50%, #fafafa 100%)";

/** Animated stat numbers + scroll chevron ring. */
export const PORTFOLIO_STAT_TEXT_GRADIENT = `linear-gradient(90deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 75%, ${PORTFOLIO_ACCENT} 100%)`;

const CTA_STOPS = `${PORTFOLIO_ACCENT_DIM}, ${PORTFOLIO_ACCENT}, ${PORTFOLIO_ACCENT_BRIGHT}, ${PORTFOLIO_ACCENT_DIM}`;

/** Rotating gradient borders (About Brian CTA, etc.). */
export const PORTFOLIO_CTA_BORDER_GRADIENTS = [
  `linear-gradient(0deg, ${CTA_STOPS})`,
  `linear-gradient(45deg, ${CTA_STOPS})`,
  `linear-gradient(90deg, ${CTA_STOPS})`,
  `linear-gradient(135deg, ${CTA_STOPS})`,
  `linear-gradient(180deg, ${CTA_STOPS})`,
  `linear-gradient(225deg, ${CTA_STOPS})`,
  `linear-gradient(270deg, ${CTA_STOPS})`,
  `linear-gradient(315deg, ${CTA_STOPS})`,
  `linear-gradient(360deg, ${CTA_STOPS})`,
] as const;

/** Hero suffix typing gradient (classic home). */
export const PORTFOLIO_HERO_SUFFIX_GRADIENTS = [
  `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
  `linear-gradient(90deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
  `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
  `linear-gradient(180deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
  `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
] as const;

export const PORTFOLIO_DECOR_LIME = [
  PORTFOLIO_ACCENT_DIM,
  PORTFOLIO_ACCENT,
  PORTFOLIO_ACCENT_BRIGHT,
  PORTFOLIO_ACCENT_SOFT,
] as const;

export function portfolioDecorLimeColor(index: number): string {
  return PORTFOLIO_DECOR_LIME[index % PORTFOLIO_DECOR_LIME.length];
}

/** Lime accent for drag/drop indicators in edit mode. */
export const PORTFOLIO_EDIT_INDICATOR_GRADIENT = `linear-gradient(90deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`;

/** Editor preview + static bio gradient text. */
export const PORTFOLIO_BIO_GRADIENT_MARK = PORTFOLIO_STAT_TEXT_GRADIENT;

/** Neutral well for screenshots — accent belongs on labels/CTAs, not letterboxing. */
export function portfolioMediaWellBackground(isModernChrome: boolean): string {
  if (isModernChrome) return "var(--modern-surface-inset)";
  return PORTFOLIO_IMAGE_WELL_GRADIENT;
}

/** @deprecated Use portfolioMediaWellBackground() — lime chrome distracts from screenshots. */
export const PORTFOLIO_MEDIA_CHROME_GRADIENT = PORTFOLIO_IMAGE_WELL_GRADIENT;

export const PORTFOLIO_ICON_COLOR_CLASS = "text-[#6a8f00] dark:text-[#95d004]";

export const PORTFOLIO_CHALLENGE_GRADIENT = "linear-gradient(135deg, #ef4444, #f97316)";

export function portfolioSectionGradient(from: string, to: string, angle = 135): string {
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

export const PORTFOLIO_SECTION_GRADIENT_VARIANTS = [
  portfolioSectionGradient(PORTFOLIO_ACCENT_DIM, PORTFOLIO_ACCENT),
  portfolioSectionGradient(PORTFOLIO_ACCENT, PORTFOLIO_ACCENT_BRIGHT),
  portfolioSectionGradient(PORTFOLIO_ACCENT_BRIGHT, PORTFOLIO_ACCENT_SOFT),
  portfolioSectionGradient(PORTFOLIO_ACCENT_SOFT, PORTFOLIO_ACCENT_DIM),
  portfolioSectionGradient(PORTFOLIO_OLIVE, PORTFOLIO_ACCENT),
  portfolioSectionGradient(PORTFOLIO_ACCENT_DIM, PORTFOLIO_ACCENT_BRIGHT),
  portfolioSectionGradient(PORTFOLIO_ACCENT, PORTFOLIO_ACCENT_SOFT),
  portfolioSectionGradient(PORTFOLIO_SURFACE, PORTFOLIO_ACCENT_DIM),
] as const;

export function portfolioSectionGradientAt(index: number): string {
  return PORTFOLIO_SECTION_GRADIENT_VARIANTS[index % PORTFOLIO_SECTION_GRADIENT_VARIANTS.length];
}

/** Rotating gradient borders on cards and image tiles. */
export const PORTFOLIO_ANIMATED_BORDER_GRADIENTS = [
  `linear-gradient(135deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
  `linear-gradient(180deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
  `linear-gradient(225deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT_DIM} 50%, ${PORTFOLIO_ACCENT} 100%)`,
  `linear-gradient(270deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
  `linear-gradient(135deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
] as const;

export const PORTFOLIO_CARD_TILE_GRADIENTS = [
  portfolioSectionGradient(PORTFOLIO_ACCENT_DIM, PORTFOLIO_ACCENT),
  portfolioSectionGradient(PORTFOLIO_ACCENT, PORTFOLIO_ACCENT_BRIGHT),
  portfolioSectionGradient(PORTFOLIO_ACCENT_BRIGHT, PORTFOLIO_ACCENT_SOFT),
  portfolioSectionGradient(PORTFOLIO_ACCENT_SOFT, PORTFOLIO_ACCENT_DIM),
  portfolioSectionGradient(PORTFOLIO_ACCENT_DIM, PORTFOLIO_ACCENT_BRIGHT),
] as const;

export function portfolioAccentAlpha(percent: number): string {
  const hex = Math.round((percent / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${PORTFOLIO_ACCENT}${hex}`;
}

export function portfolioAccentFromGradient(gradient?: string): string {
  if (gradient?.includes("#ef4444") || gradient?.includes("#f97316")) {
    return "#ef4444";
  }
  return PORTFOLIO_ACCENT;
}

export function portfolioAccentGlowFromGradient(gradient?: string, percent = 12): string {
  if (gradient?.includes("#ef4444") || gradient?.includes("#f97316")) {
    const hex = Math.round((percent / 100) * 255)
      .toString(16)
      .padStart(2, "0");
    return `#ef4444${hex}`;
  }
  return portfolioAccentAlpha(percent);
}

export const PORTFOLIO_ACCENT_RGBA_12 = "rgba(132, 189, 0, 0.12)";
export const PORTFOLIO_ACCENT_DIM_RGBA_12 = "rgba(106, 143, 0, 0.12)";
export const PORTFOLIO_ACCENT_BRIGHT_RGBA_12 = "rgba(149, 208, 4, 0.12)";
export const PORTFOLIO_ACCENT_SOFT_RGBA_12 = "rgba(163, 212, 25, 0.12)";

export const PORTFOLIO_ACCENT_RGBA_15 = "rgba(132, 189, 0, 0.15)";
export const PORTFOLIO_ACCENT_DIM_RGBA_15 = "rgba(106, 143, 0, 0.15)";
export const PORTFOLIO_ACCENT_BRIGHT_RGBA_15 = "rgba(149, 208, 4, 0.15)";
export const PORTFOLIO_ACCENT_SOFT_RGBA_15 = "rgba(163, 212, 25, 0.15)";

export const PORTFOLIO_ACCENT_RGBA_25 = "rgba(132, 189, 0, 0.25)";

/** Animated page background frames (subtle lime wash). */
export const PORTFOLIO_BG_GRADIENT_FRAMES = [
  `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM_RGBA_15} 0%, ${PORTFOLIO_ACCENT_RGBA_15} 25%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_15} 50%, ${PORTFOLIO_ACCENT_SOFT_RGBA_15} 100%)`,
  `linear-gradient(90deg, ${PORTFOLIO_ACCENT_RGBA_15} 0%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_15} 25%, ${PORTFOLIO_ACCENT_SOFT_RGBA_15} 50%, ${PORTFOLIO_ACCENT_DIM_RGBA_15} 100%)`,
  `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_15} 0%, ${PORTFOLIO_ACCENT_SOFT_RGBA_15} 25%, ${PORTFOLIO_ACCENT_DIM_RGBA_15} 50%, ${PORTFOLIO_ACCENT_RGBA_15} 100%)`,
  `linear-gradient(180deg, ${PORTFOLIO_ACCENT_SOFT_RGBA_15} 0%, ${PORTFOLIO_ACCENT_DIM_RGBA_15} 25%, ${PORTFOLIO_ACCENT_RGBA_15} 50%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_15} 100%)`,
  `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM_RGBA_15} 0%, ${PORTFOLIO_ACCENT_RGBA_15} 25%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_15} 50%, ${PORTFOLIO_ACCENT_SOFT_RGBA_15} 100%)`,
] as const;

export const PORTFOLIO_BG_RADIAL_FRAMES_LIGHT = [
  `radial-gradient(circle at 20% 30%, ${PORTFOLIO_ACCENT_SOFT_RGBA_12} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${PORTFOLIO_ACCENT_RGBA_12} 0%, transparent 50%)`,
  `radial-gradient(circle at 50% 50%, ${PORTFOLIO_ACCENT_DIM_RGBA_12} 0%, transparent 50%), radial-gradient(circle at 30% 80%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_12} 0%, transparent 50%)`,
  `radial-gradient(circle at 70% 20%, ${PORTFOLIO_ACCENT_BRIGHT_RGBA_12} 0%, transparent 50%), radial-gradient(circle at 40% 60%, ${PORTFOLIO_ACCENT_SOFT_RGBA_12} 0%, transparent 50%)`,
  `radial-gradient(circle at 20% 70%, ${PORTFOLIO_ACCENT_RGBA_12} 0%, transparent 50%), radial-gradient(circle at 90% 40%, ${PORTFOLIO_ACCENT_DIM_RGBA_12} 0%, transparent 50%)`,
  `radial-gradient(circle at 20% 30%, ${PORTFOLIO_ACCENT_SOFT_RGBA_12} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${PORTFOLIO_ACCENT_RGBA_12} 0%, transparent 50%)`,
] as const;

/** Bio hero animated gradient text (classic). */
export const PORTFOLIO_BIO_GRADIENT_ANIMATION_SETS = [
  [...PORTFOLIO_HERO_SUFFIX_GRADIENTS],
  [
    `linear-gradient(90deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(180deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(90deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
  ],
  [
    `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(180deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(90deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
  ],
  [
    `linear-gradient(180deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(45deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
    `linear-gradient(90deg, ${PORTFOLIO_ACCENT} 0%, ${PORTFOLIO_ACCENT_BRIGHT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(135deg, ${PORTFOLIO_ACCENT_BRIGHT} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_DIM} 100%)`,
    `linear-gradient(180deg, ${PORTFOLIO_ACCENT_DIM} 0%, ${PORTFOLIO_ACCENT} 50%, ${PORTFOLIO_ACCENT_BRIGHT} 100%)`,
  ],
] as const;
