import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orders/status";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Your orders" };

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { id: true, name: true, quantity: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
        <EmptyState
          tone="brand"
          icon={<Receipt className="h-6 w-6" />}
          title="No orders yet."
          message="Your next delicious meal is waiting."
          action={
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Explore Menu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-5 transition-colors hover:border-saffron-400/30"
          >
            <div className="min-w-0 grow">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-cream-100">#{order.orderNumber}</span>
                <Badge tone={STATUS_TONE[order.status] as "amber"}>
                  {STATUS_LABEL[order.status]}
                </Badge>
                <span className="text-xs text-cream-100/40">
                  {formatDate(order.createdAt, true)}
                </span>
              </div>

              <p className="mt-2 truncate text-sm text-cream-100/55">
                {order.items
                  .map((item) => `${item.name} × ${item.quantity}`)
                  .join(", ")}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-medium text-saffron-300">
                {formatCurrency(order.total)}
              </p>
              <p className="mt-0.5 text-xs text-cream-100/40">
                {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
              </p>
            </div>

            <ChevronRight
              className="h-4 w-4 shrink-0 text-cream-100/30 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
