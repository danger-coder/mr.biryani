"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";

export function AddToCartPanel({
  dish,
  signedIn,
  initiallyFavorite,
}: {
  dish: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
    available: boolean;
  };
  signedIn: boolean;
  initiallyFavorite: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [favorite, setFavorite] = React.useState(initiallyFavorite);

  if (!dish.available) {
    return (
      <div className="rounded-2xl border border-cream-100/12 bg-charcoal-900/60 p-6">
        <p className="text-sm font-medium text-cream-100">Currently Unavailable</p>
        <p className="mt-2 text-sm leading-relaxed text-cream-100/55">
          This dish is off the menu for now. It will come back — in the meantime,
          there is plenty else on the fire.
        </p>
        <Link
          href="/menu"
          className="mt-5 inline-flex text-sm text-saffron-300 underline underline-offset-4"
        >
          Back to the menu
        </Link>
      </div>
    );
  }

  const toggleFavorite = async () => {
    if (!signedIn) {
      toast.error("Sign in to save favourites");
      return;
    }
    const next = !favorite;
    setFavorite(next);
    try {
      const response = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: dish.id }),
      });
      if (!response.ok) throw new Error();
      toast.success(next ? "Saved to favourites" : "Removed from favourites");
    } catch {
      setFavorite(!next);
      toast.error("Couldn't update your favourites");
    }
  };

  return (
    <div className="rounded-2xl border border-cream-100/12 bg-charcoal-900/60 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream-100/40">Price</p>
          <p className="display mt-1 text-3xl text-saffron-300">
            {formatCurrency(dish.price)}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-cream-100/15 p-1">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/10 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span
            className="w-8 text-center text-sm font-medium text-cream-100"
            aria-live="polite"
            aria-label={`Quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(50, value + 1))}
            disabled={quantity >= 50}
            aria-label="Increase quantity"
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/10 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-cream-100/50">
        Subtotal{" "}
        <span className="font-medium text-cream-100">
          {formatCurrency(dish.price * quantity)}
        </span>
      </p>

      <div className="mt-5 flex gap-2">
        <Button
          size="lg"
          className="grow"
          onClick={() => {
            add(
              {
                menuItemId: dish.id,
                slug: dish.slug,
                name: dish.name,
                price: dish.price,
                image: dish.image,
              },
              quantity,
            );
            setQuantity(1);
          }}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          Add to cart
        </Button>

        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? "Remove from favourites" : "Save to favourites"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream-100/20 text-cream-100 transition-colors hover:border-saffron-400/50"
        >
          <Heart
            className={cn("h-4 w-4", favorite && "fill-saffron-400 text-saffron-400")}
            aria-hidden
          />
        </button>
      </div>

      <Link
        href="/cart"
        className="mt-3 block text-center text-xs text-cream-100/45 underline-offset-4 hover:text-saffron-300 hover:underline"
      >
        View cart & checkout
      </Link>
    </div>
  );
}
