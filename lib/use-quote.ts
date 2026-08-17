"use client";

import * as React from "react";
import type { PricedCart } from "@/lib/pricing";

export type Quote = PricedCart;

/**
 * Fetches an authoritative price quote whenever the cart, order type or coupon
 * changes. Requests are sequenced so a slow earlier response can never overwrite
 * a newer one.
 */
export function useQuote({
  items,
  orderType,
  couponCode,
  enabled = true,
}: {
  items: { menuItemId: string; quantity: number }[];
  orderType: "DELIVERY" | "PICKUP";
  couponCode: string | null;
  enabled?: boolean;
}) {
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  // Stable key so the effect only re-runs on a real change.
  const key = JSON.stringify({
    items: items
      .map((line) => [line.menuItemId, line.quantity] as const)
      .sort((a, b) => a[0].localeCompare(b[0])),
    orderType,
    couponCode,
  });

  React.useEffect(() => {
    if (!enabled) return;

    const payload = JSON.parse(key) as {
      items: [string, number][];
      orderType: "DELIVERY" | "PICKUP";
      couponCode: string | null;
    };

    // An empty cart needs no request; the empty result is derived below rather
    // than written into state here.
    if (payload.items.length === 0) return;

    const id = ++requestId.current;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: payload.items.map(([menuItemId, quantity]) => ({
              menuItemId,
              quantity,
            })),
            orderType: payload.orderType,
            couponCode: payload.couponCode,
          }),
          signal: controller.signal,
        });

        const data = await response.json();
        if (id !== requestId.current) return; // A newer request has taken over.

        if (!response.ok) {
          setError(data.error ?? "Couldn't price your cart.");
          setQuote(null);
        } else {
          setQuote(data.quote as Quote);
          setError(null);
        }
      } catch (cause) {
        if ((cause as Error).name === "AbortError") return;
        if (id !== requestId.current) return;
        setError("Couldn't reach the kitchen. Check your connection.");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [key, enabled]);

  const isEmpty = items.length === 0;

  return {
    quote: isEmpty ? null : quote,
    loading: isEmpty ? false : loading,
    error: isEmpty ? null : error,
  };
}
