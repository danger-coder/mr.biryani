"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image with a branded fallback.
 *
 * Cinematic assets are produced separately (see /public/images/README.md). Until
 * a file exists at the expected path, this renders a deterministic warm gradient
 * derived from the item name rather than a broken-image icon — so the design
 * reads correctly before any asset is dropped in, and upgrades automatically
 * once one is.
 */

// Warm, saturated pairs — dark enough to sit under cream type, bright enough
// that a card without its asset still reads as a designed surface rather than a
// hole in the layout.
const PALETTES = [
  ["#5a3720", "#c07a3a"],
  ["#4a3418", "#d99425"],
  ["#33401f", "#87ab5e"],
  ["#5c4416", "#e9b13f"],
  ["#4a2a1e", "#a85a32"],
  ["#3d2a14", "#efc05a"],
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

export function SmartImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  imgClassName,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority,
  seed,
}: {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  seed?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const [from, to] = paletteFor(seed ?? alt ?? "mr-biryani");
  const showFallback = !src || failed;

  return (
    <div className={cn("relative overflow-hidden bg-charcoal-800", className)}>
      {showFallback ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `radial-gradient(115% 95% at 28% 12%, ${to} 0%, ${to}99 22%, ${from} 68%, #17120d 100%)`,
          }}
          role="img"
          aria-label={alt}
        >
          <svg
            viewBox="0 0 64 64"
            className="h-1/3 max-h-16 w-auto opacity-40"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "#fdfbf7" }}
          >
            <path d="M10 34h44a0 0 0 0 1 0 0 22 22 0 0 1-22 22h0a22 22 0 0 1-22-22z" />
            <path d="M6 34h52" strokeLinecap="round" />
            <path d="M32 26c-3-2-1-5 0-7 1 2 3 5 0 7z" />
            <path d="M22 28c-2-1.4-.7-3.5 0-4.9.7 1.4 2 3.5 0 4.9z" />
            <path d="M42 28c-2-1.4-.7-3.5 0-4.9.7 1.4 2 3.5 0 4.9z" />
          </svg>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          {...(fill ? { fill: true, sizes } : { width: width ?? 600, height: height ?? 400 })}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
