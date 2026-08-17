import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api";
import { toNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const item = await db.menuItem.findFirst({
      where: { OR: [{ slug }, { id: slug }], category: { active: true } },
      include: {
        category: { select: { name: true, slug: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!item) return notFound("Menu item");

    return ok({
      item: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
        price: toNumber(item.price),
        image: item.image,
        spiceLevel: item.spiceLevel,
        vegetarian: item.vegetarian,
        available: item.available,
        featured: item.featured,
        category: item.category,
        reviews: item.reviews,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
