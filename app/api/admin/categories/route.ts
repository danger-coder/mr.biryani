import { db } from "@/lib/db";
import { categorySchema, reorderSchema } from "@/lib/validations/admin";
import { uniqueCategorySlug } from "@/lib/admin/slug";
import {
  ok,
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
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { menuItems: true } } },
    });
    return ok({ categories });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, categorySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const slug = await uniqueCategorySlug(parsed.data.name);

    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        image: parsed.data.image || `/images/categories/${slug}.webp`,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active,
      },
    });

    return ok({ category }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

/** Drag-to-reorder: the array position becomes the sortOrder. */
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, reorderSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await db.$transaction(
      parsed.data.ids.map((id, index) =>
        db.category.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
