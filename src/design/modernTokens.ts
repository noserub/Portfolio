/** Shared modern design tokens — resolve via CSS variables for light/dark themes. */
export const modern = {
  bg: "var(--modern-bg)",
  surface: "var(--modern-surface)",
  surfaceInset: "var(--modern-surface-inset)",
  border: "var(--modern-border)",
  borderHover: "var(--modern-border-hover)",
  text: "var(--modern-text)",
  muted: "var(--modern-muted-text)",
  /** Text accents: labels, links, stats, hero suffix, icons */
  accent: "var(--modern-accent)",
  /** Filled buttons and strong interactive surfaces */
  accentFill: "var(--modern-accent-fill)",
  accentFillHover: "var(--modern-accent-fill-hover)",
  /** Text on filled accent buttons (WCAG on lime) */
  accentOnFill: "var(--modern-accent-on-fill)",
  accentSubtle: "var(--modern-accent-subtle)",
  accentSubtleStrong: "var(--modern-accent-subtle-strong)",
  accentGlow: "var(--modern-accent-glow)",
  font: "Inter, sans-serif",
} as const;

export const modernFont = { fontFamily: modern.font } as const;

/** Inline style for filled lime CTAs — ensures dark labels beat inherited foreground. */
export const modernPrimaryButtonStyle = {
  fontFamily: modern.font,
  color: modern.accentOnFill,
} as const;
