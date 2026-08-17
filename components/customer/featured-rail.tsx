"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DishCard, type DishSummary } from "@/components/menu/dish-card";

/**
 * Horizontally scrolling rail of signature dishes.
 *
 * Native scroll-snap does the work (so it is keyboard- and touch-native and
 * costs no JS to scroll); the arrows are progressive enhancement and hide
 * themselves when there is nothing to scroll.
 */
export function FeaturedRail({ dishes }: { dishes: DishSummary[] }) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const sync = React.useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft < 8);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    sync();
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.8, 640),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  if (dishes.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-6 flex justify-end gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          aria-label="Previous dishes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-saffron-400/50 hover:text-saffron-300 disabled:opacity-30 disabled:hover:border-cream-100/15 disabled:hover:text-cream-100"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          aria-label="More dishes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-saffron-400/50 hover:text-saffron-300 disabled:opacity-30 disabled:hover:border-cream-100/15 disabled:hover:text-cream-100"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:scroll-pl-6 sm:px-6 lg:scroll-pl-8 lg:px-8"
      >
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[24rem]"
          >
            <DishCard dish={dish} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
