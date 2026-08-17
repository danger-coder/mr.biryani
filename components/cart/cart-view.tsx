"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Tag, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { useQuote } from "@/lib/use-quote";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState, Skeleton } from "@/components/ui/primitives";

export function CartView() {
  const { lines, ready, setQuantity, remove, couponCode, setCoupon } = useCart();
  const [orderType, setOrderType] = React.useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [couponDraft, setCouponDraft] = React.useState("");

  const { quote, loading, error } = useQuote({
    items: lines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
    })),
    orderType,
    couponCode,
  });

  React.useEffect(() => {
    if (quote?.couponError && couponCode) {
      toast.error(quote.couponError);
      setCoupon(null);
    }
  }, [quote?.couponError, couponCode, setCoupon]);

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
        <EmptyState
          tone="brand"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your cart is empty."
          message="Your next delicious meal is waiting. The dum has already started."
          action={
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Explore Menu
            </Link>
          }
        />
      </div>
    );
  }

  // Server line prices win wherever available; the cached client price is only a
  // placeholder while the first quote is in flight.
  const serverLines = new Map(quote?.lines.map((line) => [line.menuItemId, line]) ?? []);
  const unavailable = new Set(
    quote?.issues
      .filter((issue) => issue.code === "ITEM_UNAVAILABLE" || issue.code === "ITEM_MISSING")
      .map((issue) => ("menuItemId" in issue ? issue.menuItemId : ""))
      .filter(Boolean) ?? [],
  );
  const belowMinimum = quote?.issues.find((issue) => issue.code === "BELOW_MINIMUM");
  const canCheckout = Boolean(quote) && (quote?.issues.length ?? 1) === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
      <div>
        <ul className="space-y-4">
          {lines.map((line) => {
            const priced = serverLines.get(line.menuItemId);
            const unitPrice = priced?.unitPrice ?? line.price;
            const lineTotal = priced?.subtotal ?? line.price * line.quantity;
            const isUnavailable = unavailable.has(line.menuItemId);
            const priceChanged = priced && priced.unitPrice !== line.price;

            return (
              <li
                key={line.menuItemId}
                className={cn(
                  "flex gap-4 rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-3 sm:p-4",
                  isUnavailable && "border-red-500/30",
                )}
              >
                <Link
                  href={`/menu/${line.slug}`}
                  className="shrink-0"
                  aria-label={`View ${line.name}`}
                >
                  <SmartImage
                    src={line.image}
                    alt={line.name}
                    seed={line.slug}
                    className="h-20 w-20 rounded-xl sm:h-24 sm:w-24"
                    sizes="96px"
                  />
                </Link>

                <div className="flex min-w-0 grow flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-cream-100">
                        <Link href={`/menu/${line.slug}`} className="hover:text-saffron-300">
                          {line.name}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-sm text-cream-100/50">
                        {formatCurrency(unitPrice)} each
                        {priceChanged && (
                          <span className="ml-2 text-saffron-300">price updated</span>
                        )}
                      </p>
                      {isUnavailable && (
                        <p className="mt-1 text-xs text-red-400">
                          Currently unavailable — remove it to continue.
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-medium text-cream-100">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-cream-100/15 p-0.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.menuItemId, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/10"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="w-7 text-center text-sm text-cream-100">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
                        disabled={line.quantity >= 50}
                        aria-label={`Increase quantity of ${line.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/10 disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        remove(line.menuItemId);
                        toast.success("Removed from cart", { description: line.name });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-cream-100/45 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/menu"
          className="mt-6 inline-block text-sm text-saffron-300 underline-offset-4 hover:underline"
        >
          Add something else
        </Link>
      </div>

      {/* ------------------------------------------------------------ summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
        <div className="rounded-2xl border border-cream-100/12 bg-charcoal-900/60 p-5 sm:p-6">
          <h2 className="display text-2xl text-cream-100">Summary</h2>

          <div className="mt-5" role="radiogroup" aria-label="Order type">
            <div className="grid grid-cols-2 gap-2">
              {(["DELIVERY", "PICKUP"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={orderType === type}
                  onClick={() => setOrderType(type)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    orderType === type
                      ? "border-saffron-400 bg-saffron-400/12 text-saffron-300"
                      : "border-cream-100/12 text-cream-100/60 hover:border-cream-100/25",
                  )}
                >
                  {type === "DELIVERY" ? "Delivery" : "Pickup"}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="mt-5">
            {quote?.coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-leaf-400/30 bg-leaf-500/10 px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm text-leaf-400">
                  <Tag className="h-3.5 w-3.5" aria-hidden />
                  {quote.coupon.code} · {quote.coupon.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponDraft("");
                  }}
                  className="text-xs text-cream-100/55 underline-offset-4 hover:text-cream-100 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const code = couponDraft.trim().toUpperCase();
                  if (code) setCoupon(code);
                }}
                className="flex gap-2"
              >
                <label htmlFor="coupon" className="sr-only">
                  Coupon code
                </label>
                <input
                  id="coupon"
                  value={couponDraft}
                  onChange={(event) => setCouponDraft(event.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="h-10 grow rounded-lg border border-cream-100/12 bg-cream-100/5 px-3 text-sm uppercase text-cream-100 placeholder:normal-case placeholder:text-cream-100/30 focus:border-saffron-400/50"
                />
                <Button type="submit" variant="outline" className="border-cream-100/25 text-cream-100">
                  Apply
                </Button>
              </form>
            )}
          </div>

          {/* Totals — every figure here comes from the server. */}
          <dl className="mt-6 space-y-3 border-t border-cream-100/10 pt-5 text-sm">
            <Row label="Subtotal" value={quote ? formatCurrency(quote.subtotal) : "—"} />
            <Row
              label={orderType === "PICKUP" ? "Pickup" : "Delivery"}
              value={
                quote
                  ? quote.deliveryFee === 0
                    ? orderType === "PICKUP"
                      ? "Free"
                      : "Free"
                    : formatCurrency(quote.deliveryFee)
                  : "—"
              }
            />
            {quote && quote.discount > 0 && (
              <Row
                label="Discount"
                value={`− ${formatCurrency(quote.discount)}`}
                tone="leaf"
              />
            )}
            <div className="flex items-center justify-between border-t border-cream-100/10 pt-4">
              <dt className="text-base text-cream-100">Total</dt>
              <dd className="display text-2xl text-saffron-300">
                {loading && !quote ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-label="Calculating" />
                ) : quote ? (
                  formatCurrency(quote.total)
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          {quote && orderType === "DELIVERY" && quote.deliveryFee === 0 && quote.subtotal > 0 && (
            <p className="mt-3 text-xs text-leaf-400">
              Free delivery — your order is over {formatCurrency(quote.freeDeliveryOver)}.
            </p>
          )}

          {belowMinimum && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {belowMinimum.message}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-xs text-red-400">
              {error}
            </p>
          )}

          <Link
            href="/checkout"
            aria-disabled={!canCheckout}
            tabIndex={canCheckout ? 0 : -1}
            onClick={(event) => {
              if (!canCheckout) event.preventDefault();
            }}
            className={cn(
              buttonVariants({ variant: "primary", size: "lg" }),
              "mt-6 w-full",
              !canCheckout && "pointer-events-none opacity-45",
            )}
          >
            Proceed to checkout
          </Link>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-cream-100/35">
            Totals are calculated on our server at checkout.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "leaf";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-cream-100/55">{label}</dt>
      <dd className={cn("text-cream-100/85", tone === "leaf" && "text-leaf-400")}>
        {value}
      </dd>
    </div>
  );
}
