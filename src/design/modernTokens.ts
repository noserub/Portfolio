/** Shared modern design tokens — resolve via CSS variables for light/dark themes. */
export const modern = {
  bg: "var(--modern-bg)",
  surface: "var(--modern-surface)",
  surfaceInset: "var(--modern-surface-inset)",
  border: "var(--modern-border)",
  borderHover: "var(--modern-border-hover)",
  text: "var(--modern-text)",
  muted: "var(--modern-muted-text)",
  /** Eyebrow labels, stats, hero emphasis — not inline links */
  accent: "var(--modern-accent)",
  /** Hero H1; near-black on light, accent green on dark */
  heroHeadline: "var(--modern-hero-headline)",
  /** Markdown and inline body links (foreground + underline; hover uses accent) */
  link: "var(--modern-link)",
  linkHover: "var(--modern-link-hover)",
  /** Filled buttons and strong interactive surfaces */
  accentFill: "var(--modern-accent-fill)",
  accentFillHover: "var(--modern-accent-fill-hover)",
  /** Text on filled accent buttons (WCAG on lime) */
  accentOnFill: "var(--modern-accent-on-fill)",
  accentSubtle: "var(--modern-accent-subtle)",
  accentSubtleStrong: "var(--modern-accent-subtle-strong)",
  accentGlow: "var(--modern-accent-glow)",
  font: "var(--font-body)",
  displayFont: "var(--font-display)",
} as const;

export const modernFont = { fontFamily: modern.font } as const;
export const modernDisplayFont = { fontFamily: modern.displayFont } as const;

/** Inline style for filled lime CTAs — ensures dark labels beat inherited foreground. */
export const modernPrimaryButtonStyle = {
  fontFamily: modern.font,
  color: modern.accentOnFill,
} as const;
