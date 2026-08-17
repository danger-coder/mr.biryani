import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { MenuManager, type AdminMenuItem } from "@/components/admin/menu-manager";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Menu" };
export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [items, categories] = await Promise.all([
    db.menuItem.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { orderItems: true } },
      },
    }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows: AdminMenuItem[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    ingredients: item.ingredients,
    price: toNumber(item.price),
    image: item.image,
    spiceLevel: item.spiceLevel,
    vegetarian: item.vegetarian,
    available: item.available,
    featured: item.featured,
    sortOrder: item.sortOrder,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    orderCount: item._count.orderItems,
  }));

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MenuManager items={rows} categories={categories} />
    </Suspense>
  );
}
