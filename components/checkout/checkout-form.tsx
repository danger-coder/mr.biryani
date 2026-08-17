"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Info, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { useQuote } from "@/lib/use-quote";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";

type Address = {
  id: string;
  label: string;
  address: string;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
};

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

const PAYMENT_OPTIONS = [
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on Delivery",
    hint: "Pay the rider when your order arrives.",
  },
  {
    value: "ONLINE",
    label: "Online Payment",
    hint: "eSewa, Khalti or bank transfer.",
  },
  { value: "CARD", label: "Card", hint: "Card machine on delivery or at the counter." },
] as const;

export function CheckoutForm({
  user,
  addresses,
  paymentConfigured,
  paymentNotice,
}: {
  user: { name: string; email: string; phone: string | null } | null;
  addresses: Address[];
  paymentConfigured: boolean;
  paymentNotice: string;
}) {
  const router = useRouter();
  const { lines, ready, couponCode, clear } = useCart();

  const [orderType, setOrderType] = React.useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] =
    React.useState<(typeof PAYMENT_OPTIONS)[number]["value"]>("CASH_ON_DELIVERY");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const defaultAddress = addresses.find((entry) => entry.isDefault) ?? addresses[0];
  const [form, setForm] = React.useState({
    customerName: user?.name ?? "",
    customerPhone: user?.phone ?? "",
    customerEmail: user?.email ?? "",
    deliveryAddress: defaultAddress?.address ?? "",
    city: defaultAddress?.city ?? "",
    notes: "",
  });

  const { quote, loading } = useQuote({
    items: lines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
    })),
    orderType,
    couponCode,
  });

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-saffron-400" aria-label="Loading" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
        <EmptyState
          tone="brand"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="There's nothing to check out."
          message="Add a dish or two and come back — we'll keep the coal hot."
          action={
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Explore Menu
            </Link>
          }
        />
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only ids and quantities — the server prices the order itself.
          items: lines.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
          })),
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          orderType,
          deliveryAddress: orderType === "DELIVERY" ? form.deliveryAddress : "",
          city: orderType === "DELIVERY" ? form.city : "",
          paymentMethod,
          couponCode: couponCode ?? "",
          notes: form.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "We couldn't place your order.");
        if (data.details && !Array.isArray(data.details)) setFieldErrors(data.details);
        setSubmitting(false);
        return;
      }

      clear();
      toast.success("Order placed successfully", {
        description: `Order #${data.orderNumber}`,
      });
      router.push(`/checkout/success?order=${data.orderId}`);
    } catch {
      setError("We couldn't reach the kitchen. Please try again.");
      setSubmitting(false);
    }
  }

  const blocked = (quote?.issues.length ?? 0) > 0;

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12" noValidate>
      <div className="space-y-8">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {/* Order type */}
        <fieldset>
          <legend className="eyebrow text-saffron-400/80">How would you like it?</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "DELIVERY", title: "Delivery", hint: "To your door across the valley." },
                { value: "PICKUP", title: "Pickup", hint: "Collect from your nearest restaurant." },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-xl border p-4 transition-colors",
                  orderType === option.value
                    ? "border-saffron-400 bg-saffron-400/8"
                    : "border-cream-100/12 hover:border-cream-100/25",
                )}
              >
                <input
                  type="radio"
                  name="orderType"
                  value={option.value}
                  checked={orderType === option.value}
                  onChange={() => setOrderType(option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium text-cream-100">
                  {option.title}
                </span>
                <span className="mt-1 block text-xs text-cream-100/50">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Contact */}
        <fieldset className="space-y-4">
          <legend className="eyebrow text-saffron-400/80">Your details</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="customerName" error={fieldErrors.customerName} required>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(event) => update("customerName")(event.target.value)}
                autoComplete="name"
                required
                error={fieldErrors.customerName}
                className={inputTone}
              />
            </Field>
            <Field label="Phone" htmlFor="customerPhone" error={fieldErrors.customerPhone} required>
              <Input
                id="customerPhone"
                type="tel"
                value={form.customerPhone}
                onChange={(event) => update("customerPhone")(event.target.value)}
                autoComplete="tel"
                required
                placeholder="+977 98XXXXXXXX"
                error={fieldErrors.customerPhone}
                className={inputTone}
              />
            </Field>
          </div>
          <Field
            label="Email"
            htmlFor="customerEmail"
            error={fieldErrors.customerEmail}
            hint="For your order confirmation."
          >
            <Input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={(event) => update("customerEmail")(event.target.value)}
              autoComplete="email"
              error={fieldErrors.customerEmail}
              className={inputTone}
            />
          </Field>
        </fieldset>

        {/* Address */}
        {orderType === "DELIVERY" && (
          <fieldset className="space-y-4">
            <legend className="eyebrow text-saffron-400/80">Where to</legend>

            {addresses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {addresses.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        deliveryAddress: entry.address,
                        city: entry.city,
                      }))
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-xs transition-colors",
                      form.deliveryAddress === entry.address
                        ? "border-saffron-400 text-saffron-300"
                        : "border-cream-100/12 text-cream-100/60 hover:border-cream-100/30",
                    )}
                  >
                    {entry.label} · {entry.city}
                  </button>
                ))}
              </div>
            )}

            <Field
              label="Street address"
              htmlFor="deliveryAddress"
              error={fieldErrors.deliveryAddress}
              required
            >
              <Input
                id="deliveryAddress"
                value={form.deliveryAddress}
                onChange={(event) => update("deliveryAddress")(event.target.value)}
                autoComplete="street-address"
                required
                placeholder="142 Durbar Marg, Ward 1"
                error={fieldErrors.deliveryAddress}
                className={inputTone}
              />
            </Field>

            <Field label="City" htmlFor="city" error={fieldErrors.city} required>
              <Input
                id="city"
                value={form.city}
                onChange={(event) => update("city")(event.target.value)}
                autoComplete="address-level2"
                required
                placeholder="Kathmandu"
                error={fieldErrors.city}
                className={inputTone}
              />
            </Field>
          </fieldset>
        )}

        {/* Payment */}
        <fieldset>
          <legend className="eyebrow text-saffron-400/80">Payment</legend>
          <div className="mt-4 space-y-2">
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  paymentMethod === option.value
                    ? "border-saffron-400 bg-saffron-400/8"
                    : "border-cream-100/12 hover:border-cream-100/25",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mt-0.5 h-4 w-4 accent-saffron-400"
                />
                <span>
                  <span className="block text-sm font-medium text-cream-100">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-cream-100/50">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {!paymentConfigured && paymentMethod !== "CASH_ON_DELIVERY" && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-cream-100/12 bg-cream-100/4 px-3.5 py-3 text-xs leading-relaxed text-cream-100/60">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron-400" aria-hidden />
              {paymentNotice}
            </p>
          )}
        </fieldset>

        <Field
          label="Notes for the kitchen"
          htmlFor="notes"
          hint="Allergies, spice preference, delivery instructions."
        >
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(event) => update("notes")(event.target.value)}
            maxLength={500}
            placeholder="Ring the bell twice. Extra raita if possible."
            className={inputTone}
          />
        </Field>
      </div>

      {/* --------------------------------------------------------- order summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
        <div className="rounded-2xl border border-cream-100/12 bg-charcoal-900/60 p-5 sm:p-6">
          <h2 className="display text-2xl text-cream-100">Your order</h2>

          <ul className="mt-5 space-y-3 border-b border-cream-100/10 pb-5">
            {(quote?.lines ?? []).map((line) => (
              <li key={line.menuItemId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-cream-100/70">
                  <span className="text-cream-100">{line.name}</span>
                  <span className="text-cream-100/45"> × {line.quantity}</span>
                </span>
                <span className="shrink-0 text-cream-100/85">
                  {formatCurrency(line.subtotal)}
                </span>
              </li>
            ))}
            {!quote && (
              <li className="text-sm text-cream-100/45">Pricing your order…</li>
            )}
          </ul>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-cream-100/55">Subtotal</dt>
              <dd className="text-cream-100/85">
                {quote ? formatCurrency(quote.subtotal) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream-100/55">
                {orderType === "PICKUP" ? "Pickup" : "Delivery"}
              </dt>
              <dd className="text-cream-100/85">
                {quote ? (quote.deliveryFee === 0 ? "Free" : formatCurrency(quote.deliveryFee)) : "—"}
              </dd>
            </div>
            {quote && quote.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-cream-100/55">
                  Discount{quote.coupon && ` · ${quote.coupon.code}`}
                </dt>
                <dd className="text-leaf-400">− {formatCurrency(quote.discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-cream-100/10 pt-4">
              <dt className="text-base text-cream-100">Total</dt>
              <dd className="display text-2xl text-saffron-300">
                {loading && !quote ? "…" : quote ? formatCurrency(quote.total) : "—"}
              </dd>
            </div>
          </dl>

          {quote?.issues.map((issue) => (
            <p
              key={issue.code + ("menuItemId" in issue ? issue.menuItemId : "")}
              className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300"
            >
              {issue.message}
            </p>
          ))}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={submitting}
            disabled={blocked || !quote}
          >
            Place order
          </Button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-cream-100/35">
            By placing this order you agree to our terms. Prices are confirmed by
            our server before your order is created.
          </p>
        </div>
      </aside>
    </form>
  );
}
