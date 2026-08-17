import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { PAYMENT_METHOD_LABEL } from "@/lib/orders/status";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const user = await getCurrentUser();

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      // A guest can see the order they just placed (it has no owner). An order
      // that belongs to an account is only visible to that account.
      ...(user ? { OR: [{ userId: user.id }, { userId: null }] } : { userId: null }),
    },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      location: { select: { name: true, address: true, city: true, phone: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-500/15">
            <CheckCircle2 className="h-7 w-7 text-leaf-400" aria-hidden />
          </div>
          <h1 className="display mt-6 text-[clamp(2.25rem,6vw,3.5rem)] text-cream-100">
            Order placed.
          </h1>
          <p className="mt-4 text-cream-100/60">
            Thank you, {order.customerName.split(" ")[0]}. Your order{" "}
            <span className="text-saffron-300">#{order.orderNumber}</span> is with
            the kitchen.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section
            className="rounded-2xl border border-cream-100/12 bg-charcoal-900/50 p-6"
            aria-labelledby="progress-heading"
          >
            <h2 id="progress-heading" className="display text-xl text-cream-100">
              Progress
            </h2>
            <div className="mt-6">
              <OrderTimeline
                status={order.status}
                orderType={order.orderType}
                events={order.events}
              />
            </div>
          </section>

          <section
            className="rounded-2xl border border-cream-100/12 bg-charcoal-900/50 p-6"
            aria-labelledby="summary-heading"
          >
            <h2 id="summary-heading" className="display text-xl text-cream-100">
              Summary
            </h2>

            <ul className="mt-5 space-y-3 border-b border-cream-100/10 pb-5">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-cream-100/70">
                    <span className="text-cream-100">{item.name}</span>
                    <span className="text-cream-100/45"> × {item.quantity}</span>
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
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Placed {formatDate(order.createdAt, true)}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {order.customerPhone}
              </p>
              {order.orderType === "DELIVERY" && order.deliveryAddress && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {order.deliveryAddress}
                  {order.city && `, ${order.city}`}
                </p>
              )}
              <p className="pt-1 text-xs text-cream-100/45">
                Payment: {PAYMENT_METHOD_LABEL[order.paymentMethod]} ·{" "}
                {order.paymentStatus === "PAID" ? "Paid" : "Not yet paid"}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link
              href={`/account/orders/${order.id}`}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Track this order
            </Link>
          ) : (
            <Link
              href="/register"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Create an account to track it
            </Link>
          )}
          <Link
            href="/menu"
            className={`${buttonVariants({ variant: "outline", size: "lg" })} border-cream-100/25 text-cream-100`}
          >
            Order something else
          </Link>
        </div>
      </div>
    </div>
  );
}
