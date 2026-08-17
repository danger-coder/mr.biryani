import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { toNumber } from "@/lib/utils";
import { DishCard, type DishSummary } from "@/components/menu/dish-card";
import { EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Your favourites" };

export default async function FavoritesPage() {
  const user = await requireUser("/account/favorites");

  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      menuItem: { include: { category: { select: { name: true } } } },
    },
  });

  const dishes: DishSummary[] = favorites.map((favorite) => ({
    id: favorite.menuItem.id,
    slug: favorite.menuItem.slug,
    name: favorite.menuItem.name,
    description: favorite.menuItem.description,
    price: toNumber(favorite.menuItem.price),
    image: favorite.menuItem.image,
    spiceLevel: favorite.menuItem.spiceLevel,
    vegetarian: favorite.menuItem.vegetarian,
    available: favorite.menuItem.available,
    featured: favorite.menuItem.featured,
    categoryName: favorite.menuItem.category.name,
  }));

  if (dishes.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
        <EmptyState
          tone="brand"
          icon={<Heart className="h-6 w-6" />}
          title="Nothing saved yet."
          message="Tap the heart on any dish to keep it here for next time."
          action={
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Explore Menu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {dishes.map((dish) => (
        <DishCard key={dish.id} dish={dish} showFavorite isFavorite />
      ))}
    </div>
  );
}
