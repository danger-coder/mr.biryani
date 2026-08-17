import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, StickyNote } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import {
  PAYMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/orders/status";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Badge } from "@/components/ui/primitives";
import { ReviewForm } from "@/components/customer/review-form";

export const metadata: Metadata = { title: "Order details" };

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);

  // Scoped to this customer: another customer's order id simply doesn't match.
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      location: { select: { name: true, address: true, city: true, phone: true } },
      reviews: { select: { id: true, menuItemId: true } },
    },
  });

  if (!order) notFound();

  const reviewedItems = new Set(order.reviews.map((review) => review.menuItemId));
  const reviewable =
    order.status === "DELIVERED"
      ? order.items.filter(
          (item) => item.menuItemId && !reviewedItems.has(item.menuItemId),
        )
      : [];

  return (
    <div className="space-y-8">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-cream-100/50 transition-colors hover:text-saffron-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="display text-3xl text-cream-100">#{order.orderNumber}</h2>
        <Badge tone={STATUS_TONE[order.status] as "amber"}>
          {STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section
          className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6"
          aria-labelledby="timeline-heading"
        >
          <h3 id="timeline-heading" className="display text-xl text-cream-100">
            Progress
          </h3>
          <div className="mt-6">
            <OrderTimeline
              status={order.status}
              orderType={order.orderType}
              events={order.events}
            />
          </div>
        </section>

        <section
          className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6"
          aria-labelledby="items-heading"
        >
          <h3 id="items-heading" className="display text-xl text-cream-100">
            Items
          </h3>

          <ul className="mt-5 space-y-3 border-b border-cream-100/10 pb-5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-cream-100/70">
                  <span className="text-cream-100">{item.name}</span>
                  <span className="text-cream-100/45"> × {item.quantity}</span>
                  <span className="mt-0.5 block text-xs text-cream-100/35">
                    {formatCurrency(item.price)} each at the time of order
                  </span>
                </span>
                <span className="shrink-0 text-cream-100/85">
                  {formatCurrency(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-cream-100/55">Subtotal</dt>
              <dd className="text-cream-100/85">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream-100/55">
                {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
              </dt>
              <dd className="text-cream-100/85">
                {toNumber(order.deliveryFee) === 0
                  ? "Free"
                  : formatCurrency(order.deliveryFee)}
              </dd>
            </div>
            {toNumber(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-cream-100/55">
                  Discount{order.couponCode && ` · ${order.couponCode}`}
                </dt>
                <dd className="text-leaf-400">− {formatCurrency(order.discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-cream-100/10 pt-4">
              <dt className="text-cream-100">Total</dt>
              <dd className="display text-2xl text-saffron-300">
                {formatCurrency(order.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2.5 border-t border-cream-100/10 pt-5 text-sm text-cream-100/60">
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {order.customerPhone}
            </p>
            {order.deliveryAddress && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {order.deliveryAddress}
                {order.city && `, ${order.city}`}
              </p>
            )}
            {order.notes && (
              <p className="flex items-start gap-2">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {order.notes}
              </p>
            )}
            <p className="pt-1 text-xs text-cream-100/40">
              Placed {formatDate(order.createdAt, true)} · {PAYMENT_METHOD_LABEL[order.paymentMethod]} ·{" "}
              {PAYMENT_LABEL[order.paymentStatus]}
            </p>
          </div>
        </section>
      </div>

      {reviewable.length > 0 && (
        <section
          className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6"
          aria-labelledby="review-heading"
        >
          <h3 id="review-heading" className="display text-xl text-cream-100">
            How was it?
          </h3>
          <p className="mt-2 text-sm text-cream-100/55">
            Reviews are moderated before they appear on the site.
          </p>
          <div className="mt-6">
            <ReviewForm
              orderId={order.id}
              items={reviewable.map((item) => ({
                menuItemId: item.menuItemId!,
                name: item.name,
              }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
