import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, StickyNote, User } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, humanize, toNumber } from "@/lib/utils";
import {
  PAYMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/orders/status";
import { Badge, Card, CardHeader } from "@/components/ui/primitives";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderActions } from "@/components/admin/order-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return { title: order ? `Order #${order.orderNumber}` : "Order" };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      location: { select: { name: true, city: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-5">
      <div className="no-print">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All orders
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Order #{order.orderNumber}
          </h1>
          <Badge tone={STATUS_TONE[order.status] as "amber"}>
            {STATUS_LABEL[order.status]}
          </Badge>
          <Badge tone={order.paymentStatus === "PAID" ? "green" : "slate"}>
            {PAYMENT_LABEL[order.paymentStatus]}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          Placed {formatDate(order.createdAt, true)}
        </p>
      </div>

      <Card className="no-print">
        <CardHeader title="Actions" description="Status changes notify the customer." />
        <div className="p-4">
          <OrderActions
            orderId={order.id}
            status={order.status}
            orderType={order.orderType}
            paymentStatus={order.paymentStatus}
          />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Items"
              description="Prices are frozen at the moment the order was placed."
            />
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-md text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Item</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-slate-500">
                      Subtotal
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-900">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-slate-500">
                      {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-900">
                      {toNumber(order.deliveryFee) === 0
                        ? "Free"
                        : formatCurrency(order.deliveryFee)}
                    </td>
                  </tr>
                  {toNumber(order.discount) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-slate-500">
                        Discount{order.couponCode && ` · ${order.couponCode}`}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-600">
                        − {formatCurrency(order.discount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-200">
                    <td colSpan={3} className="px-4 py-3 text-right font-medium text-slate-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <div className="p-5">
              <OrderTimeline
                status={order.status}
                orderType={order.orderType}
                events={order.events}
                tone="admin"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Customer" />
            <dl className="space-y-3 p-4 text-sm">
              <div className="flex items-start gap-2.5">
                <dt className="sr-only">Name</dt>
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <dd className="text-slate-900">
                  {order.customerName}
                  {order.user ? (
                    <Link
                      href={`/admin/customers/${order.user.id}`}
                      className="ml-2 text-xs text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
                    >
                      View profile
                    </Link>
                  ) : (
                    <span className="ml-2 text-xs text-slate-400">Guest order</span>
                  )}
                </dd>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="sr-only">Phone</dt>
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <dd>
                  <a
                    href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                    className="text-slate-700 underline-offset-4 hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              {order.customerEmail && (
                <div className="flex items-start gap-2.5">
                  <dt className="sr-only">Email</dt>
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  <dd>
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="break-all text-slate-700 underline-offset-4 hover:underline"
                    >
                      {order.customerEmail}
                    </a>
                  </dd>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="flex items-start gap-2.5">
                  <dt className="sr-only">Delivery address</dt>
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  <dd className="text-slate-700">
                    {order.deliveryAddress}
                    {order.city && `, ${order.city}`}
                  </dd>
                </div>
              )}
              {order.notes && (
                <div className="flex items-start gap-2.5">
                  <dt className="sr-only">Notes</dt>
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  <dd className="text-slate-700">{order.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Order details" />
            <dl className="divide-y divide-slate-100 text-sm">
              {[
                { label: "Type", value: humanize(order.orderType) },
                { label: "Payment method", value: PAYMENT_METHOD_LABEL[order.paymentMethod] },
                { label: "Payment status", value: PAYMENT_LABEL[order.paymentStatus] },
                { label: "Coupon", value: order.couponCode ?? "None" },
                {
                  label: "Location",
                  value: order.location
                    ? `${order.location.name.replace("Mr. Biryani — ", "")}, ${order.location.city}`
                    : "Not assigned",
                },
                { label: "Last updated", value: formatDate(order.updatedAt, true) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3 px-4 py-2.5">
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd className="text-right text-slate-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
