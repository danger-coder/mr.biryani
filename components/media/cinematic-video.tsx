"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/media/smart-image";

/**
 * Background video with graceful degradation, in this order:
 *   1. `prefers-reduced-motion` → never plays, poster only.
 *   2. Video file missing or fails to decode → poster only.
 *   3. Poster missing too → SmartImage's branded gradient.
 *
 * Videos are muted, inline, and lazily attached so they never block first paint.
 */
export function CinematicVideo({
  src,
  poster,
  alt,
  className,
  overlayClassName,
  loop = true,
  seed,
}: {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
  overlayClassName?: string;
  loop?: boolean;
  seed?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [usable, setUsable] = React.useState(false);
  const [reduced, setReduced] = React.useState(true);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (reduced) return;
    const element = videoRef.current;
    if (!element) return;

    // Only start loading once the section is close to the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          element.pause();
          return;
        }
        element.play().catch(() => setUsable(false));
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div className={cn("relative overflow-hidden bg-charcoal-950", className)}>
      <SmartImage
        src={poster}
        alt={alt}
        seed={seed ?? alt}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          usable && !reduced ? "opacity-0" : "opacity-100",
        )}
        sizes="100vw"
        priority
      />

      {!reduced && (
        <video
          ref={videoRef}
          muted
          loop={loop}
          playsInline
          preload="none"
          aria-hidden
          tabIndex={-1}
          onCanPlay={() => setUsable(true)}
          onError={() => setUsable(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            usable ? "opacity-100" : "opacity-0",
          )}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {overlayClassName && <div className={cn("absolute inset-0", overlayClassName)} aria-hidden />}
    </div>
  );
}
