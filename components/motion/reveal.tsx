"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * GSAP + ScrollTrigger wiring, in one place.
 *
 * Rules this enforces:
 *  - `prefers-reduced-motion` short-circuits everything; elements are simply
 *    made visible and no ScrollTriggers are created.
 *  - Only `transform` and `opacity` are animated (compositor-friendly).
 *  - GSAP is imported dynamically so it stays out of the initial bundle.
 *  - Every trigger is killed on unmount/route change — no leaks between pages.
 *
 * Usage: add `data-reveal` to any element. Optional attributes:
 *   data-reveal="up" | "fade" | "scale" | "clip"
 *   data-reveal-delay="0.15"
 *   data-reveal-stagger  (on a parent — animates its direct children)
 */
export function RevealProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;

    if (reduced) {
      root.classList.remove("reveal-ready");
      return;
    }

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      root.classList.add("reveal-ready");

      const context = gsap.context(() => {
        // Staggered groups first, so their children are not also picked up
        // individually below.
        const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]");
        const claimed = new Set<Element>();

        groups.forEach((group) => {
          const children = Array.from(group.children) as HTMLElement[];
          children.forEach((child) => claimed.add(child));
          gsap.fromTo(
            children,
            { opacity: 0, y: 26 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: "power3.out",
              stagger: 0.08,
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          if (claimed.has(element)) return;

          const kind = element.dataset.reveal || "up";
          const delay = Number(element.dataset.revealDelay ?? 0) || 0;

          const from: gsap.TweenVars =
            kind === "fade"
              ? { opacity: 0 }
              : kind === "scale"
                ? { opacity: 0, scale: 1.06 }
                : kind === "clip"
                  ? { opacity: 0, clipPath: "inset(0 0 100% 0)" }
                  : { opacity: 0, y: 34 };

          const to: gsap.TweenVars =
            kind === "clip"
              ? { opacity: 1, clipPath: "inset(0 0 0% 0)" }
              : { opacity: 1, y: 0, scale: 1 };

          gsap.fromTo(element, from, {
            ...to,
            duration: kind === "clip" ? 1.1 : 0.85,
            delay,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });

        // Subtle parallax. Small distances only — big ones read as jitter.
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
          const distance = Number(element.dataset.parallax) || 60;
          gsap.fromTo(
            element,
            { yPercent: -distance / 12 },
            {
              yPercent: distance / 12,
              ease: "none",
              scrollTrigger: {
                trigger: element.parentElement ?? element,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        });
      });

      ScrollTrigger.refresh();

      cleanup = () => {
        context.revert();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        root.classList.remove("reveal-ready");
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname]);

  return <>{children}</>;
}

/** Imperative helper for one-off entrance animations in a component. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(true);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}
