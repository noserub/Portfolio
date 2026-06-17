import {
  getHeroGreetingAnimationPlan,
  type HeroGreetingAnimationPlan,
} from "../lib/homePageContent";

export const MODERN_HERO_PREFIX = "AI Product";
export const MODERN_HERO_SUFFIXES = ["Builder", "Leader"] as const;

/** Full greeting lines for suffix-only animation plan. */
export function getModernHeroGreetingLines(): string[] {
  return MODERN_HERO_SUFFIXES.map((suffix) => `${MODERN_HERO_PREFIX} ${suffix}`);
}

export function getModernHeroAnimationPlan(): HeroGreetingAnimationPlan {
  return getHeroGreetingAnimationPlan(getModernHeroGreetingLines(), "suffix-only");
}

/** Visible suffix word while typing (strip shared prefix). */
export function getModernHeroSuffixFromDisplayed(displayedText: string, plan: HeroGreetingAnimationPlan): string {
  if (plan.mode === "suffix-only" && plan.sharedPrefix) {
    return displayedText.slice(plan.sharedPrefix.length).trim();
  }
  return displayedText.replace(MODERN_HERO_PREFIX, "").trim();
}
