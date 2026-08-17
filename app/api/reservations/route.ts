import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { reservationSchema } from "@/lib/validations/order";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { notify } from "@/lib/notifications";
import { getSettings, settingBool } from "@/lib/settings";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function GET() {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  try {
    const reservations = await db.reservation.findMany({
      where: { userId: auth.user.id },
      orderBy: { date: "desc" },
      include: { location: { select: { name: true, address: true, city: true } } },
    });
    return ok({ reservations });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const limit = rateLimit(await clientKey("reservation"), 6, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("Too many reservation requests. Please call us instead.", 429);
  }

  const settings = await getSettings();
  if (!settingBool(settings, "reservationsEnabled")) {
    return fail("Online reservations are temporarily closed. Please call us.", 503);
  }

  const parsed = await parseBody(request, reservationSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  // Dates are validated server-side: a booking cannot be made for the past, and
  // not more than 90 days out.
  const date = new Date(`${input.date}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 90);

  if (Number.isNaN(date.getTime()) || date < today) {
    return fail("Please choose a date from today onwards.", 422, {
      date: "Choose a date from today onwards.",
    });
  }
  if (date > horizon) {
    return fail("We take bookings up to 90 days ahead.", 422, {
      date: "Bookings open up to 90 days ahead.",
    });
  }

  try {
    const user = await getCurrentUser();

    // Only accept a location id that actually exists and is open for business.
    let locationId: string | null = null;
    if (input.locationId) {
      const location = await db.restaurantLocation.findFirst({
        where: { id: input.locationId, active: true },
        select: { id: true },
      });
      locationId = location?.id ?? null;
    }

    const reservation = await db.reservation.create({
      data: {
        userId: user?.id ?? null,
        locationId,
        name: input.name,
        phone: input.phone,
        email: input.email || user?.email || null,
        date,
        time: input.time,
        guests: input.guests,
        notes: input.notes || null,
        status: "PENDING",
      },
      select: { id: true, date: true, time: true, guests: true, status: true },
    });

    if (user) {
      await notify({
        userId: user.id,
        type: "RESERVATION",
        title: "Reservation Requested",
        message: `We've received your request for ${input.guests} on ${input.date} at ${input.time}. We'll confirm shortly.`,
        link: "/account/reservations",
      });
    }

    await notify({
      forAdmin: true,
      type: "RESERVATION",
      title: "New Reservation",
      message: `${input.name} requested a table for ${input.guests} on ${input.date} at ${input.time}.`,
      link: "/admin/reservations",
    });

    return ok({ reservation }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
