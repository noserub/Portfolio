import { useEffect, useMemo } from "react";
import {
  getHeroGreetingAnimationPlan,
  getHeroHeadlineMode,
  resolveStaticHeroHeadline,
  type HeroTextState,
} from "../../lib/homePageContent";
import { useHeroTypingAnimation } from "../../hooks/useHeroTypingAnimation";
import { modern } from "../../design/modernTokens";

interface ModernTypingHeroProps {
  hero: HeroTextState;
  loading?: boolean;
}

export function ModernTypingHero({ hero, loading = false }: ModernTypingHeroProps) {
  const headlineMode = getHeroHeadlineMode(hero);
  const staticHeadline = useMemo(() => resolveStaticHeroHeadline(hero), [hero]);

  const greetingLines = useMemo(() => {
    const lines = hero.greetings?.length ? hero.greetings : [hero.greeting];
    return lines.filter((line) => line?.trim());
  }, [hero.greetings, hero.greeting]);

  const plan = useMemo(
    () => getHeroGreetingAnimationPlan(greetingLines, hero.heroRetypeMode ?? "full"),
    [greetingLines, hero.heroRetypeMode],
  );

  const { displayedText, suffixVisible, reset } = useHeroTypingAnimation({
    plan,
    lastGreetingPauseDuration: hero.lastGreetingPauseDuration ?? 30000,
    paused: loading || headlineMode === "static",
  });

  const planKey = useMemo(
    () => JSON.stringify({ greetings: plan.greetings, mode: plan.mode, prefix: plan.sharedPrefix }),
    [plan],
  );

  useEffect(() => {
    if (!loading) reset();
  }, [loading, planKey, reset]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const suffixOnlyLayout =
    plan.mode === "suffix-only" && Boolean(plan.sharedPrefix) && greetingLines.length >= 2;

  const sharedPrefix = (plan.sharedPrefix ?? "").trimEnd();
  const staticSuffix = plan.mode === "suffix-only" && plan.suffixes?.length ? plan.suffixes[0] : "";
  const reducedMotionText = suffixOnlyLayout
    ? staticSuffix
    : greetingLines[0] ?? "";

  const suffixDisplay = prefersReducedMotion ? reducedMotionText : suffixOnlyLayout ? suffixVisible : displayedText;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse" aria-hidden>
        <div className="h-9 w-48 rounded-md" style={{ background: modern.surface }} />
        <div className="h-12 w-56 rounded-md" style={{ background: modern.surface }} />
      </div>
    );
  }

  if (headlineMode === "static") {
    return (
      <div className="space-y-1">
        <div
          className="modern-type-display leading-tight"
          style={{
            fontWeight: 500,
            fontSize: "clamp(24px, 3vw, 32px)",
            color: modern.muted,
          }}
        >
          {staticHeadline.prefix}
        </div>
        <div
          className="modern-type-display leading-tight"
          style={{
            fontWeight: 600,
            fontSize: "clamp(40px, 5.5vw, 64px)",
            color: modern.accent,
          }}
        >
          {staticHeadline.main}
        </div>
      </div>
    );
  }

  if (suffixOnlyLayout) {
    return (
      <div className="space-y-1">
        <div
          className="modern-type-display leading-tight"
          style={{
            fontWeight: 500,
            fontSize: "clamp(24px, 3vw, 32px)",
            color: modern.muted,
          }}
        >
          {sharedPrefix}
        </div>
        <div
          className="modern-type-display leading-tight"
          style={{
            fontWeight: 600,
            fontSize: "clamp(40px, 5.5vw, 64px)",
            color: modern.accent,
          }}
          aria-live="polite"
        >
          {suffixDisplay}
          {!prefersReducedMotion ? <span className="modern-typing-cursor" aria-hidden /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="modern-type-display leading-tight"
      style={{
        fontWeight: 600,
        fontSize: "clamp(32px, 5vw, 56px)",
        color: modern.accent,
      }}
      aria-live="polite"
    >
      {suffixDisplay}
      {!prefersReducedMotion ? <span className="modern-typing-cursor" aria-hidden /> : null}
    </div>
  );
}
