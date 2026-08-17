import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/guards";
import { MenuFilters } from "@/components/menu/menu-filters";
import { DishCard, type DishSummary } from "@/components/menu/dish-card";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Biryani, kebabs, curries, breads and desserts — the full Mr. Biryani menu, cooked to order.",
};

type SearchParams = Promise<{
  search?: string;
  category?: string;
  sort?: string;
  veg?: string;
}>;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const categorySlug = params.category ?? "";
  const sort = params.sort ?? "recommended";
  const vegOnly = params.veg === "1";

  const where: Prisma.MenuItemWhereInput = {
    category: { active: true, ...(categorySlug ? { slug: categorySlug } : {}) },
    ...(vegOnly ? { vegetarian: true } : {}),
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

  const user = await getCurrentUser();

  const [items, categories, favorites] = await Promise.all([
    db.menuItem.findMany({
      where,
      orderBy,
      include: { category: { select: { name: true, slug: true } } },
    }),
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }),
    user
      ? db.favorite.findMany({
          where: { userId: user.id },
          select: { menuItemId: true },
        })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favorites.map((entry) => entry.menuItemId));

  const dishes: DishSummary[] = items.map((item) => ({
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
  }));

  const activeCategory = categories.find((entry) => entry.slug === categorySlug);

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="eyebrow text-saffron-400">The Menu</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            {activeCategory ? activeCategory.name : "Everything we cook."}
          </h1>
          <p className="mt-5 text-cream-100/60">
            Every dish is made to order. Biryani takes a little longer because it
            should.
          </p>
        </header>

        <div className="mt-12">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <MenuFilters categories={categories} resultCount={dishes.length} />
          </Suspense>
        </div>

        {dishes.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
            <EmptyState
              tone="brand"
              icon={<UtensilsCrossed className="h-6 w-6" />}
              title="Nothing matches that."
              message="Try a different search, or clear the filters to see the whole menu."
              action={
                <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Show everything
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                showFavorite={Boolean(user)}
                isFavorite={favoriteIds.has(dish.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
