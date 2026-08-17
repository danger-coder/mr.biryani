import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, CalendarDays, Heart, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { ProfileForm, PasswordForm } from "@/components/customer/profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountPage() {
  const user = await requireUser("/account");

  const [orderCount, spendAgg, reservationCount, favoriteCount, lastOrder] =
    await Promise.all([
      db.order.count({ where: { userId: user.id } }),
      db.order.aggregate({
        where: { userId: user.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.reservation.count({ where: { userId: user.id } }),
      db.favorite.count({ where: { userId: user.id } }),
      db.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, status: true, createdAt: true },
      }),
    ]);

  const stats = [
    { label: "Orders", value: String(orderCount), icon: Receipt, href: "/account/orders" },
    {
      label: "Total spent",
      value: formatCurrency(toNumber(spendAgg._sum.total)),
      icon: Wallet,
      href: "/account/orders",
    },
    {
      label: "Reservations",
      value: String(reservationCount),
      icon: CalendarDays,
      href: "/account/reservations",
    },
    { label: "Favourites", value: String(favoriteCount), icon: Heart, href: "/account/favorites" },
  ];

  return (
    <div className="space-y-12">
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Account summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-cream-100/10 bg-charcoal-900/40 p-4 transition-colors hover:border-saffron-400/30"
            >
              <stat.icon className="h-4 w-4 text-saffron-400" aria-hidden />
              <p className="mt-3 text-xl font-medium text-cream-100">{stat.value}</p>
              <p className="mt-0.5 text-xs text-cream-100/45">{stat.label}</p>
            </Link>
          ))}
        </div>

        {lastOrder && (
          <p className="mt-4 text-sm text-cream-100/50">
            Your last order{" "}
            <Link
              href={`/account/orders/${lastOrder.id}`}
              className="text-saffron-300 underline underline-offset-4"
            >
              #{lastOrder.orderNumber}
            </Link>{" "}
            on {formatDate(lastOrder.createdAt)}.
          </p>
        )}
      </section>

      <section
        className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6"
        aria-labelledby="profile-heading"
      >
        <h2 id="profile-heading" className="display text-2xl text-cream-100">
          Your details
        </h2>
        <div className="mt-6 max-w-md">
          <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />
        </div>
      </section>

      <section
        className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6"
        aria-labelledby="password-heading"
      >
        <h2 id="password-heading" className="display text-2xl text-cream-100">
          Password
        </h2>
        <div className="mt-6 max-w-md">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
