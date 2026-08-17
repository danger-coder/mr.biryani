import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

/**
 * Slugs appear in public URLs, so they must be unique. Collisions get a numeric
 * suffix rather than failing the write.
 */
export async function uniqueMenuSlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  return unique(name, "dish", excludeId, (slug) =>
    db.menuItem.findUnique({ where: { slug }, select: { id: true } }),
  );
}

export async function uniqueCategorySlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  return unique(name, "category", excludeId, (slug) =>
    db.category.findUnique({ where: { slug }, select: { id: true } }),
  );
}

export async function uniqueLocationSlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  return unique(name, "location", excludeId, (slug) =>
    db.restaurantLocation.findUnique({ where: { slug }, select: { id: true } }),
  );
}

async function unique(
  name: string,
  fallback: string,
  excludeId: string | undefined,
  lookup: (slug: string) => Promise<{ id: string } | null>,
): Promise<string> {
  const base = slugify(name) || fallback;
  let candidate = base;
  let suffix = 2;

  // Bounded so a pathological dataset can't spin here forever.
  for (let attempt = 0; attempt < 500; attempt++) {
    const existing = await lookup(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix++}`;
  }

  return `${base}-${Date.now()}`;
}
