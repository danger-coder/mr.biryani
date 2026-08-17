import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Users, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatDate, humanize } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Your reservations" };

const TONE = {
  PENDING: "amber",
  CONFIRMED: "green",
  COMPLETED: "slate",
  CANCELLED: "red",
} as const;

export default async function AccountReservationsPage() {
  const user = await requireUser("/account/reservations");

  const reservations = await db.reservation.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { location: { select: { name: true, address: true, city: true } } },
  });

  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
        <EmptyState
          tone="brand"
          icon={<CalendarDays className="h-6 w-6" />}
          title="No reservations yet."
          message="Book a table and we'll open the handi in front of you."
          action={
            <Link
              href="/reservations"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Book a table
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reservations.map((reservation) => (
        <li
          key={reservation.id}
          className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="display text-xl text-cream-100">
                {formatDate(reservation.date)}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-cream-100/55">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {reservation.time}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {reservation.guests} {reservation.guests === 1 ? "guest" : "guests"}
                </span>
                {reservation.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {reservation.location.name.replace("Mr. Biryani — ", "")}
                  </span>
                )}
              </div>
              {reservation.notes && (
                <p className="mt-3 text-sm text-cream-100/45">{reservation.notes}</p>
              )}
            </div>

            <Badge tone={TONE[reservation.status]}>
              {humanize(reservation.status)}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
