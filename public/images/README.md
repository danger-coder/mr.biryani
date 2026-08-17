# Cinematic assets

Every path below is optional — the app falls back to a branded gradient
placeholder (see `components/media/smart-image.tsx`) when a file is missing, so
nothing breaks while assets are still being produced.

Paths are declared once in `lib/assets.ts`.

## Current state

All **28 stills are present** — generated with Higgsfield (`z_image`), exported
to WebP at the width each one is actually rendered at (hero 1920, dish cards
1000, category tiles 800, location cards 1200). Total weight ≈ 3.1 MB.

**The five videos are still missing**, so the hero, dum panel and CTA band fall
back to their poster stills — which is the intended degradation, not a fault.
Add the MP4s listed at the bottom to switch the motion on.

To regenerate or extend the stills:

```bash
higgsfield generate create z_image --aspect_ratio 4:3 --prompt "<dish>. <style>" --wait
```

Keep the shared style suffix consistent so the set stays coherent: *dark moody
charcoal background, dramatic warm side lighting, deep shadows, rich saffron gold
tones, shallow depth of field, premium restaurant editorial food photography*.

## Stills (`/public/images/`)

| File | Used by |
| --- | --- |
| `hero-biryani.webp` | Home hero poster (also the reduced-motion fallback) |
| `dum-cooking.webp` | Home — "The Dum" story panel |
| `chef-cooking.webp` | Home — craft section |
| `spice-market.webp` | Home — ingredients strip |
| `restaurant-interior.webp` | About / Locations |
| `restaurant-interior-2.webp` | Our Story |
| `founder-portrait.webp` | Our Story |
| `handi-closeup.webp` | Closing CTA band |

## Menu items (`/public/images/menu/<slug>.webp`)

Slug matches the `MenuItem.slug` column, e.g.:
`chicken-dum-biryani.webp`, `mutton-dum-biryani.webp`, `garlic-naan.webp`.

## Categories (`/public/images/categories/<slug>.webp`)

`biryani.webp`, `starters.webp`, `main-course.webp`, `breads.webp`, `rice.webp`,
`drinks.webp`, `desserts.webp`.

## Locations (`/public/images/locations/<slug>.webp`)

`durbar-marg.webp`, `jhamsikhel.webp`, `lakeside.webp`.

## Video (`/public/videos/`)

| File | Used by |
| --- | --- |
| `hero-biryani.mp4` | Hero background |
| `chef-cooking.mp4` | Craft section |
| `dum-cooking.mp4` | Dum storytelling panel |
| `food-closeup.mp4` | Menu intro |
| `restaurant-atmosphere.mp4` | About / Locations |

Keep videos muted, 6–12s, H.264 MP4, ideally under ~4 MB each. They are lazily
attached and never autoplay under `prefers-reduced-motion`.
