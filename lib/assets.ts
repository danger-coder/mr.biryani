/**
 * Single registry for cinematic assets.
 *
 * Nothing else in the app hardcodes a media path — swapping in newly generated
 * Higgsfield renders means dropping files into /public and, at most, editing
 * this file. Every consumer degrades gracefully when a file is absent
 * (see components/media/smart-image.tsx).
 */

export const IMAGES = {
  heroPoster: "/images/hero-biryani.webp",
  storyDum: "/images/dum-cooking.webp",
  storyChef: "/images/chef-cooking.webp",
  storySpices: "/images/spice-market.webp",
  interior: "/images/restaurant-interior.webp",
  interiorAlt: "/images/restaurant-interior-2.webp",
  aboutFounder: "/images/founder-portrait.webp",
  ctaBanner: "/images/handi-closeup.webp",
} as const;

export const VIDEOS = {
  hero: "/videos/hero-biryani.mp4",
  chef: "/videos/chef-cooking.mp4",
  dum: "/videos/dum-cooking.mp4",
  closeup: "/videos/food-closeup.mp4",
  atmosphere: "/videos/restaurant-atmosphere.mp4",
} as const;

/** Derives the expected image path for a menu item slug. */
export function menuImage(slug: string): string {
  return `/images/menu/${slug}.webp`;
}

export function categoryImage(slug: string): string {
  return `/images/categories/${slug}.webp`;
}
