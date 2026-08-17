import { db } from "@/lib/db";
import { locationUpdateSchema } from "@/lib/validations/admin";
import { uniqueLocationSlug } from "@/lib/admin/slug";
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

function coordinate(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, locationUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const existing = await db.restaurantLocation.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    if (!existing) return notFound("Location");

    const slug =
      input.name && input.name !== existing.name
        ? await uniqueLocationSlug(input.name, existing.id)
        : existing.slug;

    const location = await db.restaurantLocation.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name, slug } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.openingHours !== undefined
          ? { openingHours: input.openingHours }
          : {}),
        ...(input.latitude !== undefined ? { latitude: coordinate(input.latitude) } : {}),
        ...(input.longitude !== undefined
          ? { longitude: coordinate(input.longitude) }
          : {}),
        ...(input.image !== undefined ? { image: input.image || null } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    return ok({ location });
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
    const location = await db.restaurantLocation.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { orders: true, reservations: true } },
      },
    });
    if (!location) return notFound("Location");

    const linked = location._count.orders + location._count.reservations;
    if (linked > 0) {
      // Orders and reservations keep pointing at this row for reporting, so a
      // location with history is deactivated rather than removed.
      const deactivated = await db.restaurantLocation.update({
        where: { id },
        data: { active: false },
        select: { id: true, active: true },
      });
      return ok({
        deleted: false,
        location: deactivated,
        message: `"${location.name}" has ${linked} linked ${
          linked === 1 ? "record" : "records"
        }, so it has been deactivated instead of deleted.`,
      });
    }

    await db.restaurantLocation.delete({ where: { id } });
    return ok({ deleted: true, message: `"${location.name}" was deleted.` });
  } catch (error) {
    return serverError(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const location = await db.restaurantLocation.findUnique({ where: { id } });
  if (!location) return fail("Location not found.", 404);
  return ok({ location });
}
