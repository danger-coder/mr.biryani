import { db } from "@/lib/db";
import { reservationStatusSchema } from "@/lib/validations/admin";
import { notify } from "@/lib/notifications";
import { humanize } from "@/lib/utils";
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

const TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, reservationStatusSchema);
  if (!parsed.ok) return parsed.response;

  const nextStatus = parsed.data.status;

  try {
    const reservation = await db.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        name: true,
        guests: true,
        date: true,
        time: true,
      },
    });
    if (!reservation) return notFound("Reservation");

    if (reservation.status === nextStatus) {
      return fail(`This reservation is already ${humanize(nextStatus)}.`, 409);
    }
    if (TERMINAL.has(reservation.status)) {
      return fail(
        `A ${humanize(reservation.status).toLowerCase()} reservation can't be changed.`,
        409,
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.reservation.update({
        where: { id },
        data: { status: nextStatus },
        select: { id: true, status: true },
      });

      if (reservation.userId) {
        const dateLabel = reservation.date.toISOString().slice(0, 10);
        await notify({
          tx,
          userId: reservation.userId,
          type: "RESERVATION",
          title:
            nextStatus === "CONFIRMED"
              ? "Reservation Confirmed"
              : nextStatus === "CANCELLED"
                ? "Reservation Cancelled"
                : "Reservation Updated",
          message:
            nextStatus === "CONFIRMED"
              ? `Your table for ${reservation.guests} on ${dateLabel} at ${reservation.time} is confirmed. We look forward to seeing you.`
              : nextStatus === "CANCELLED"
                ? `Your reservation on ${dateLabel} at ${reservation.time} has been cancelled. Please call us if this is unexpected.`
                : `Your reservation on ${dateLabel} is now ${humanize(nextStatus).toLowerCase()}.`,
          link: "/account/reservations",
        });
      }

      return result;
    });

    return ok({ reservation: updated });
  } catch (error) {
    return serverError(error);
  }
}
