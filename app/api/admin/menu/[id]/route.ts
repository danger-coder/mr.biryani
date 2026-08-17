import { db } from "@/lib/db";
import { menuItemUpdateSchema } from "@/lib/validations/admin";
import { toNumber } from "@/lib/utils";
import { uniqueMenuSlug } from "@/lib/admin/slug";
import {
  ok,
  fail,
  notFound,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, menuItemUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const existing = await db.menuItem.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    if (!existing) return notFound("Menu item");

    if (input.categoryId) {
      const category = await db.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) {
        return fail("That category no longer exists.", 422, {
          categoryId: "Choose an existing category.",
        });
      }
    }

    // Renaming re-slugs the item so its public URL stays readable.
    const slug =
      input.name && input.name !== existing.name
        ? await uniqueMenuSlug(input.name, existing.id)
        : existing.slug;

    const item = await db.menuItem.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.name !== undefined ? { name: input.name, slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.ingredients !== undefined
          ? { ingredients: input.ingredients || null }
          : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.image !== undefined ? { image: input.image || null } : {}),
        ...(input.spiceLevel !== undefined ? { spiceLevel: input.spiceLevel } : {}),
        ...(input.vegetarian !== undefined ? { vegetarian: input.vegetarian } : {}),
        ...(input.available !== undefined ? { available: input.available } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });

    return ok({ item: { ...item, price: toNumber(item.price) } });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const item = await db.menuItem.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { orderItems: true } } },
    });
    if (!item) return notFound("Menu item");

    // Deleting an ordered item would break the audit trail from an order line
    // back to the catalogue. Disabling keeps history intact and takes it off the
    // menu just as effectively.
    if (item._count.orderItems > 0) {
      const disabled = await db.menuItem.update({
        where: { id },
        data: { available: false, featured: false },
        select: { id: true, available: true },
      });
      return ok({
        deleted: false,
        item: disabled,
        message: `"${item.name}" appears in ${item._count.orderItems} past ${
          item._count.orderItems === 1 ? "order" : "orders"
        }, so it has been disabled instead of deleted. Order history is preserved.`,
      });
    }

    await db.menuItem.delete({ where: { id } });
    return ok({ deleted: true, message: `"${item.name}" was deleted.` });
  } catch (error) {
    return serverError(error);
  }
}
