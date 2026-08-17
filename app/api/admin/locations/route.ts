import { db } from "@/lib/db";
import { locationSchema } from "@/lib/validations/admin";
import { uniqueLocationSlug } from "@/lib/admin/slug";
import {
  ok,
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

export async function GET() {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  try {
    const locations = await db.restaurantLocation.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { orders: true, reservations: true } } },
    });
    return ok({ locations });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, locationSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const slug = await uniqueLocationSlug(input.name);

    const location = await db.restaurantLocation.create({
      data: {
        name: input.name,
        slug,
        address: input.address,
        city: input.city,
        phone: input.phone,
        email: input.email || null,
        openingHours: input.openingHours,
        latitude: coordinate(input.latitude),
        longitude: coordinate(input.longitude),
        image: input.image || `/images/locations/${slug}.webp`,
        active: input.active,
      },
    });

    return ok({ location }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
