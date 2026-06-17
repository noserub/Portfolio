import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHeroDeleteStopLength,
  HERO_BETWEEN_GREETINGS_PAUSE_MS,
  HERO_DELETE_DELAY_MS,
  HERO_SEQUENCE_PAUSE_MS,
  HERO_TYPING_DELAY_MIN_MS,
  HERO_TYPING_DELAY_RANGE_MS,
  type HeroGreetingAnimationPlan,
} from "../lib/homePageContent";

export interface UseHeroTypingAnimationOptions {
  plan: HeroGreetingAnimationPlan;
  /** Pause after last greeting before cycling (ms). */
  lastGreetingPauseDuration?: number;
  /** When true, animation does not run. */
  paused?: boolean;
}

export function useHeroTypingAnimation({
  plan,
  lastGreetingPauseDuration = 30000,
  paused = false,
}: UseHeroTypingAnimationOptions) {
  const planRef = useRef(plan);
  planRef.current = plan;

  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaitingForCycle, setIsWaitingForCycle] = useState(false);

  useEffect(() => {
    if (paused) return;

    const currentPlan = planRef.current;
    const greetings = currentPlan.greetings;
    if (!greetings || greetings.length === 0) return;

    const currentGreeting = greetings[currentGreetingIndex] || "";
    const deleteStopLength = getHeroDeleteStopLength(currentPlan);
    const isLastGreeting = currentGreetingIndex === greetings.length - 1;

    let delay: number;

    if (isWaitingForCycle) {
      delay = lastGreetingPauseDuration;
    } else if (!isDeleting) {
      if (displayedText.length < currentGreeting.length) {
        delay = HERO_TYPING_DELAY_MIN_MS + Math.floor(Math.random() * HERO_TYPING_DELAY_RANGE_MS);
      } else {
        delay = HERO_SEQUENCE_PAUSE_MS;
      }
    } else if (displayedText.length > deleteStopLength) {
      delay = HERO_DELETE_DELAY_MS;
    } else {
      delay = HERO_BETWEEN_GREETINGS_PAUSE_MS;
    }

    const timer = setTimeout(() => {
      const activePlan = planRef.current;
      const activeGreetings = activePlan.greetings;
      const activeGreeting = activeGreetings[currentGreetingIndex] || "";
      const stopLength = getHeroDeleteStopLength(activePlan);
      const lastGreeting = currentGreetingIndex === activeGreetings.length - 1;

      if (isWaitingForCycle) {
        setIsWaitingForCycle(false);
        setIsDeleting(true);
      } else if (!isDeleting) {
        if (displayedText.length < activeGreeting.length) {
          if (activePlan.mode === "suffix-only" && displayedText.length < stopLength) {
            setDisplayedText(activeGreeting.slice(0, stopLength));
          } else {
            setDisplayedText(activeGreeting.slice(0, displayedText.length + 1));
          }
        } else if (lastGreeting) {
          setIsWaitingForCycle(true);
        } else {
          setIsDeleting(true);
        }
      } else if (displayedText.length > stopLength) {
        setDisplayedText(displayedText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentGreetingIndex((prev) => (prev + 1) % activeGreetings.length);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    displayedText,
    isDeleting,
    currentGreetingIndex,
    isWaitingForCycle,
    lastGreetingPauseDuration,
    paused,
  ]);

  const reset = useCallback(() => {
    setDisplayedText("");
    setCurrentGreetingIndex(0);
    setIsDeleting(false);
    setIsWaitingForCycle(false);
  }, []);

  return {
    displayedText,
    currentGreetingIndex,
    isDeleting,
    isWaitingForCycle,
    reset,
    sharedPrefix:
      plan.mode === "suffix-only" && plan.sharedPrefix ? plan.sharedPrefix : undefined,
    suffixVisible:
      plan.mode === "suffix-only" && plan.sharedPrefix
        ? displayedText.slice(plan.sharedPrefix.length)
        : displayedText,
  };
}
