"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CinematicVideo } from "@/components/media/cinematic-video";
import { buttonVariants } from "@/components/ui/button-variants";
import { Stars } from "@/components/ui/primitives";
import { IMAGES, VIDEOS } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * Full-bleed cinematic hero.
 *
 * The parallax is a single scrub-free rAF read (transform only) rather than a
 * ScrollTrigger, so it stays smooth on low-end devices. It is skipped entirely
 * under reduced motion.
 */
export function Hero({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const layerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.min(window.scrollY, 800);
        if (layerRef.current) {
          layerRef.current.style.transform = `translate3d(0, ${offset * 0.22}px, 0)`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden" aria-label="Introduction">
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <CinematicVideo
          src={VIDEOS.hero}
          poster={IMAGES.heroPoster}
          alt="A handi of biryani being opened, steam rising"
          seed="hero-biryani"
          className="h-[118%] w-full"
        />
      </div>

      {/*
        Three scrims, each doing one job, so the type stays legible over any
        asset without flattening the photograph:
          1. vertical  — anchors the header and the fade into the next section
          2. horizontal— protects the text column, which is left-aligned
          3. radial    — settles the bottom edge
      */}
      <div
        className="absolute inset-0 bg-linear-to-b from-charcoal-950/85 via-charcoal-950/30 to-charcoal-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-r from-charcoal-950/95 via-charcoal-950/60 to-charcoal-950/10 lg:via-charcoal-950/45 lg:to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(11,10,9,0.9),transparent_60%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <p className="eyebrow animate-fade-up text-saffron-400" style={{ animationDelay: "0.1s" }}>
          Authentic · Flavorful · Unforgettable
        </p>

        <h1
          className="display animate-fade-up mt-6 max-w-4xl text-[clamp(2.75rem,9vw,6.5rem)] text-cream-100"
          style={{ animationDelay: "0.2s" }}
        >
          The Biryani You&rsquo;ll
          <br />
          <span className="text-saffron-400">Crave Again.</span>
        </h1>

        <p
          className="animate-fade-up mt-7 max-w-xl text-base leading-relaxed text-cream-100/70 sm:text-lg"
          style={{ animationDelay: "0.32s" }}
        >
          Slow-cooked. Fragrant. Authentic. Crafted with generations of flavour —
          sealed under dough and finished on live coal, the way it has always been
          done.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "0.44s" }}
        >
          <Link href="/menu" className={cn(buttonVariants({ variant: "primary", size: "xl" }), "group")}>
            Order Now
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "outline", size: "xl" }),
              "border-cream-100/30 text-cream-100 hover:border-cream-100/60",
            )}
          >
            Explore Menu
          </Link>
        </div>

        <div
          className="animate-fade-up mt-12 flex items-center gap-4"
          style={{ animationDelay: "0.56s" }}
        >
          <Stars rating={rating} size={16} />
          <div className="text-sm">
            <span className="font-semibold text-cream-100">{rating.toFixed(1)}/5</span>
            <span className="ml-2 text-cream-100/50">
              Customer Rating{reviewCount > 0 && ` · ${reviewCount} reviews`}
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-7 flex justify-center text-cream-100/35"
        aria-hidden
      >
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </div>
    </section>
  );
}
