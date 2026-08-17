import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: { select: { menuItems: { where: { available: true } } } },
      },
    });

    return ok({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        itemCount: category._count.menuItems,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
