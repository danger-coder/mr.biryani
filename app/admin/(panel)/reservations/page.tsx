import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { CalendarDays, Phone, StickyNote } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, humanize } from "@/lib/utils";
import { Badge, Card, EmptyState, Pagination, Skeleton } from "@/components/ui/primitives";
import { FilterBar } from "@/components/admin/filters";
import { ReservationActions } from "@/components/admin/reservation-actions";

export const metadata: Metadata = { title: "Reservations" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const TONE = {
  PENDING: "amber",
  CONFIRMED: "green",
  COMPLETED: "slate",
  CANCELLED: "red",
} as const;

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";

  const where: Prisma.ReservationWhereInput = {
    ...(params.status
      ? { status: params.status as Prisma.EnumReservationStatusFilter["equals"] }
      : {}),
    ...(params.from || params.to
      ? {
          date: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00.000Z`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T00:00:00.000Z`) } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [reservations, total, pending] = await Promise.all([
    db.reservation.findMany({
      where,
      orderBy: [{ date: "desc" }, { time: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { location: { select: { name: true, city: true } } },
    }),
    db.reservation.count({ where }),
    db.reservation.count({ where: { status: "PENDING" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const buildHref = (target: number) => {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value) as [string, string][],
    );
    next.set("page", String(target));
    return `/admin/reservations?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reservations</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {total} matching · {pending} awaiting confirmation.
        </p>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-3">
          <Suspense fallback={<Skeleton className="h-9 w-64" />}>
            <FilterBar
              searchPlaceholder="Name, phone or email…"
              dates
              selects={[
                {
                  key: "status",
                  label: "All statuses",
                  options: (["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map(
                    (value) => ({ value, label: humanize(value) }),
                  ),
                },
              ]}
            />
          </Suspense>
        </div>

        {reservations.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No reservations found."
            message="Try changing your filters or widening the date range."
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {reservations.map((reservation) => (
                <li key={reservation.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{reservation.name}</p>
                        <Badge tone={TONE[reservation.status]}>
                          {humanize(reservation.status)}
                        </Badge>
                      </div>

                      <p className="mt-1.5 text-sm text-slate-600">
                        {formatDate(reservation.date)} at {reservation.time} ·{" "}
                        {reservation.guests}{" "}
                        {reservation.guests === 1 ? "guest" : "guests"}
                        {reservation.location &&
                          ` · ${reservation.location.name.replace("Mr. Biryani — ", "")}`}
                      </p>

                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3" aria-hidden />
                          {reservation.phone}
                        </span>
                        {reservation.email && <span>{reservation.email}</span>}
                        <span>Requested {formatDate(reservation.createdAt)}</span>
                      </p>

                      {reservation.notes && (
                        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                          {reservation.notes}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <ReservationActions
                        reservationId={reservation.id}
                        status={reservation.status}
                        guestName={reservation.name}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              buildHref={buildHref}
            />
          </>
        )}
      </Card>
    </div>
  );
}
