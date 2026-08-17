import { db } from "@/lib/db";
import { categoryUpdateSchema } from "@/lib/validations/admin";
import { uniqueCategorySlug } from "@/lib/admin/slug";
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
  const parsed = await parseBody(request, categoryUpdateSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const existing = await db.category.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    if (!existing) return notFound("Category");

    const slug =
      parsed.data.name && parsed.data.name !== existing.name
        ? await uniqueCategorySlug(parsed.data.name, existing.id)
        : existing.slug;

    const category = await db.category.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name, slug } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description || null }
          : {}),
        ...(parsed.data.image !== undefined
          ? { image: parsed.data.image || null }
          : {}),
        ...(parsed.data.sortOrder !== undefined
          ? { sortOrder: parsed.data.sortOrder }
          : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
    });

    return ok({ category });
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
    const category = await db.category.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { menuItems: true } } },
    });
    if (!category) return notFound("Category");

    // The schema restricts this deletion anyway; failing here gives a useful
    // message instead of a foreign-key error.
    if (category._count.menuItems > 0) {
      return fail(
        `"${category.name}" still holds ${category._count.menuItems} ${
          category._count.menuItems === 1 ? "dish" : "dishes"
        }. Move or delete them first, or just disable the category.`,
        409,
      );
    }

    await db.category.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
