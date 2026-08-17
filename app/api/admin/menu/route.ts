import { db } from "@/lib/db";
import { menuItemSchema } from "@/lib/validations/admin";
import { toNumber } from "@/lib/utils";
import { uniqueMenuSlug } from "@/lib/admin/slug";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function GET() {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  try {
    const items = await db.menuItem.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { category: { select: { id: true, name: true } } },
    });
    return ok({
      items: items.map((item) => ({ ...item, price: toNumber(item.price) })),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, menuItemSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const category = await db.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      return fail("That category no longer exists.", 422, {
        categoryId: "Choose an existing category.",
      });
    }

    const slug = await uniqueMenuSlug(input.name);

    const item = await db.menuItem.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug,
        description: input.description,
        ingredients: input.ingredients || null,
        price: input.price,
        image: input.image || `/images/menu/${slug}.webp`,
        spiceLevel: input.spiceLevel,
        vegetarian: input.vegetarian,
        available: input.available,
        featured: input.featured,
        sortOrder: input.sortOrder,
      },
    });

    return ok({ item: { ...item, price: toNumber(item.price) } }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
