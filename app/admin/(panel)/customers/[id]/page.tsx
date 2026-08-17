import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Receipt, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, humanize, toNumber } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orders/status";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { CustomerStatus } from "@/components/admin/customer-status";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await db.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: customer ? customer.name : "Customer" };
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Explicit select: authentication data is never loaded into this page.
  const customer = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { id: true, name: true, quantity: true } } },
      },
      reservations: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!customer) notFound();

  const paidOrders = customer.orders.filter((order) => order.status !== "CANCELLED");
  const lifetimeValue = paidOrders.reduce(
    (sum, order) => sum + toNumber(order.total),
    0,
  );
  const averageOrder = paidOrders.length > 0 ? lifetimeValue / paidOrders.length : 0;

  const stats = [
    { label: "Orders", value: String(customer.orders.length), icon: Receipt },
    { label: "Lifetime revenue", value: formatCurrency(lifetimeValue), icon: Wallet },
    { label: "Average order", value: formatCurrency(averageOrder), icon: Wallet },
    {
      label: "Reservations",
      value: String(customer.reservations.length),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All customers
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-lg font-semibold text-slate-900">
            {customer.name}
            <Badge tone={customer.active ? "green" : "slate"}>
              {customer.active ? "Active" : "Deactivated"}
            </Badge>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {customer.email}
            {customer.phone && ` · ${customer.phone}`} · joined{" "}
            {formatDate(customer.createdAt)}
          </p>
        </div>

        <CustomerStatus
          customerId={customer.id}
          name={customer.name}
          active={customer.active}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-slate-300" aria-hidden />
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Orders" description="Most recent first" />
          {customer.orders.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title="No orders yet."
              message="This customer hasn't ordered anything."
            />
          ) : (
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-lg text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Items</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-slate-900 underline-offset-4 hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                        {order.items
                          .map((item) => `${item.name} × ${item.quantity}`)
                          .join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={STATUS_TONE[order.status] as "amber"}>
                          {STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Addresses" />
            {customer.addresses.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No saved addresses.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                      {address.label}
                      {address.isDefault && <Badge tone="amber">Default</Badge>}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-600">
                      {address.address}, {address.city}
                      {address.postalCode && ` ${address.postalCode}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Reservations" />
            {customer.reservations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No reservations.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {customer.reservations.map((reservation) => (
                  <li key={reservation.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm text-slate-900">
                        {formatDate(reservation.date)} at {reservation.time}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {reservation.guests}{" "}
                        {reservation.guests === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        reservation.status === "CONFIRMED"
                          ? "green"
                          : reservation.status === "CANCELLED"
                            ? "red"
                            : reservation.status === "PENDING"
                              ? "amber"
                              : "slate"
                      }
                    >
                      {humanize(reservation.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
