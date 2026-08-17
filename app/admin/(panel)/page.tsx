import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ListOrdered,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import {
  RANGES,
  customerMix,
  daysAgo,
  dashboardStats,
  popularItems,
  resolveRange,
  revenueByCategory,
  revenueSeries,
  salesTotals,
} from "@/lib/admin/queries";
import { Card, CardHeader } from "@/components/ui/primitives";
import { CategoryChart, OrdersChart, RevenueChart } from "@/components/admin/charts";
import { LiveOrders } from "@/components/admin/live-orders";
import { RangePicker } from "@/components/admin/range-picker";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Validated against a fixed list, so the query string can't ask for an
  // unbounded scan.
  const range = resolveRange((await searchParams).range);
  const since = daysAgo(range.days);

  const [stats, series, popular, categories, mix, totals, recent] = await Promise.all([
    dashboardStats(),
    revenueSeries(range.days),
    popularItems(6, since),
    revenueByCategory(since),
    customerMix(range.days),
    salesTotals(),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
  ]);

  const cards = [
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todayRevenue),
      change: stats.revenueChange,
      icon: Wallet,
      href: "/admin/orders",
    },
    {
      label: "Today's Orders",
      value: String(stats.todayOrders),
      change: stats.ordersChange,
      icon: ListOrdered,
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: String(stats.pendingOrders),
      icon: TrendingUp,
      href: "/admin/orders?status=PENDING",
      urgent: stats.pendingOrders > 0,
    },
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString("en-IN"),
      icon: Users,
      href: "/admin/customers",
    },
    {
      label: "Reservations",
      value: String(stats.upcomingReservations),
      icon: CalendarDays,
      href: "/admin/reservations",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Today at a glance. The analytics below cover {range.label.toLowerCase()}.
          </p>
        </div>
        <RangePicker ranges={RANGES} active={range.value} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full p-4 transition-colors hover:border-slate-300">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <card.icon
                  className={
                    card.urgent ? "h-4 w-4 text-amber-500" : "h-4 w-4 text-slate-300"
                  }
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                {card.value}
              </p>
              {card.change !== undefined && card.change !== null && (
                <p
                  className={`mt-1.5 inline-flex items-center gap-1 text-xs ${
                    card.change >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {card.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" aria-hidden />
                  )}
                  {Math.abs(card.change).toFixed(0)}% vs yesterday
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Period totals */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Today", data: totals.daily },
          { label: "Last 7 days", data: totals.weekly },
          { label: "Last 30 days", data: totals.monthly },
        ].map((period) => (
          <Card key={period.label} className="p-4">
            <p className="text-xs font-medium text-slate-500">{period.label}</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(period.data.revenue)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {period.data.orders} {period.data.orders === 1 ? "order" : "orders"}
              {period.data.orders > 0 &&
                ` · ${formatCurrency(period.data.revenue / period.data.orders)} average`}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Revenue"
            description={`${range.label}, excluding cancelled orders`}
          />
          <div className="p-4">
            <RevenueChart data={series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Orders" description="Order volume per day" />
          <div className="p-4">
            <OrdersChart data={series} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader
            title="Popular items"
            description={`By quantity sold · ${range.label.toLowerCase()}`}
            action={
              <Link
                href="/admin/menu"
                className="text-xs text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Manage menu
              </Link>
            }
          />
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-md text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th scope="col" className="px-4 py-2.5 font-medium">Dish</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Sold</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {popular.map((item) => (
                  <tr key={`${item.menuItemId}-${item.name}`}>
                    <td className="px-4 py-2.5 text-slate-900">{item.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
                {popular.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                      No sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Revenue by category" description={range.label} />
          <div className="p-4">
            <CategoryChart data={categories} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <LiveOrders
            initial={recent.map((order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              status: order.status,
              total: Number(order.total),
              createdAt: order.createdAt.toISOString(),
            }))}
          />
        </Card>

        <Card>
          <CardHeader title="Customers" description={range.label} />
          <dl className="divide-y divide-slate-100">
            {[
              { label: "New customers", value: mix.newCustomers },
              { label: "Customers who ordered", value: mix.activeBuyers },
              { label: "Returning (2+ orders)", value: mix.returningBuyers },
              { label: "One-time buyers", value: mix.oneTimeBuyers },
              {
                label: "Average order value",
                value: formatCurrency(stats.averageOrderValue),
              },
              { label: "Lifetime revenue", value: formatCurrency(stats.totalRevenue) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <dt className="text-sm text-slate-600">{row.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-slate-900">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
