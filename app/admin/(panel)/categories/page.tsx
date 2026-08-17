import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryManager, type AdminCategory } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { menuItems: true } } },
  });

  const rows: AdminCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    sortOrder: category.sortOrder,
    active: category.active,
    itemCount: category._count.menuItems,
  }));

  return <CategoryManager categories={rows} />;
}
