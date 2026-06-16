import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface HomeScrollChevronProps {
  caseStudiesRef: React.RefObject<HTMLElement | null>;
}

/**
 * Isolated scroll chevron so scroll events do not re-render the entire Home page.
 */
export const HomeScrollChevron = memo(function HomeScrollChevron({
  caseStudiesRef,
}: HomeScrollChevronProps) {
  const [showUp, setShowUp] = useState(false);
  const scrollYRef = useRef(0);
  const directionRef = useRef<"up" | "down">("down");
  const showUpRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  const scrollToCaseStudies = useCallback(() => {
    caseStudiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [caseStudiesRef]);

  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const prev = scrollYRef.current;

      if (scrollTop !== prev) {
        directionRef.current = scrollTop > prev ? "down" : "up";
      }
      scrollYRef.current = scrollTop;

      const threshold = 100;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isNearTop = scrollTop < threshold;
      const isNearBottom = documentHeight - scrollTop - windowHeight < threshold;

      let nextShowUp = false;
      if (isNearTop) {
        nextShowUp = false;
      } else if (isNearBottom) {
        nextShowUp = true;
      } else {
        nextShowUp = directionRef.current === "up";
      }

      if (nextShowUp !== showUpRef.current) {
        showUpRef.current = nextShowUp;
        setShowUp(nextShowUp);
      }
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-center py-6 md:py-10 relative z-10">
      <div className="home-scroll-chevron-ring rounded-full p-[2px] inline-block flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (showUp) scrollToTop();
            else scrollToCaseStudies();
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="relative rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-background/80 backdrop-blur-sm hover:bg-background/60 cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary z-20"
          aria-label={showUp ? "Scroll to top" : "Scroll to case studies"}
        >
          {showUp ? (
            <ChevronUp className="w-6 h-6 text-foreground stroke-[3]" />
          ) : (
            <ChevronDown className="w-6 h-6 text-foreground stroke-[3]" />
          )}
        </button>
      </div>
    </div>
  );
});
