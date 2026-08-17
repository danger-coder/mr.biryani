import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api";
import { toNumber } from "@/lib/utils";

/** Public menu listing. Read-only, cacheable, no auth. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "recommended";
  const vegetarianOnly = url.searchParams.get("veg") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 100);

  const where: Prisma.MenuItemWhereInput = {
    category: { active: true, ...(category ? { slug: category } : {}) },
    ...(vegetarianOnly ? { vegetarian: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { ingredients: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.MenuItemOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: "asc" }]
      : sort === "price-desc"
        ? [{ price: "desc" }]
        : sort === "name"
          ? [{ name: "asc" }]
          : [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }];

  try {
    const items = await db.menuItem.findMany({
      where,
      orderBy,
      take: limit,
      include: { category: { select: { name: true, slug: true } } },
    });

    return ok({
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        price: toNumber(item.price),
        image: item.image,
        spiceLevel: item.spiceLevel,
        vegetarian: item.vegetarian,
        available: item.available,
        featured: item.featured,
        categoryName: item.category.name,
        categorySlug: item.category.slug,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
