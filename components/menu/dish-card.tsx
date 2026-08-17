"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Leaf, Flame, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { SmartImage } from "@/components/media/smart-image";
import { useCart } from "@/components/cart/cart-provider";

export type DishSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  spiceLevel: "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  vegetarian: boolean;
  available: boolean;
  featured?: boolean;
  categoryName?: string;
};

export function SpiceMeter({ level }: { level: DishSummary["spiceLevel"] }) {
  const filled = { MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 }[level];
  const label = { MILD: "Mild", MEDIUM: "Medium", HOT: "Hot", EXTRA_HOT: "Extra hot" }[level];

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`Spice level: ${label}`}
      role="img"
      aria-label={`Spice level: ${label}`}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Flame
          key={index}
          className={cn(
            "h-3 w-3",
            index < filled ? "text-clay-500" : "text-current opacity-20",
          )}
          fill={index < filled ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function DishCard({
  dish,
  isFavorite = false,
  showFavorite = false,
  onToggleFavorite,
  className,
}: {
  dish: DishSummary;
  isFavorite?: boolean;
  showFavorite?: boolean;
  onToggleFavorite?: (menuItemId: string, next: boolean) => void;
  className?: string;
}) {
  const { add } = useCart();
  const [favorite, setFavorite] = React.useState(isFavorite);
  const [lastProp, setLastProp] = React.useState(isFavorite);

  // Adjusting state during render (rather than in an effect) is React's
  // recommended way to resync when a prop changes — no extra commit.
  if (lastProp !== isFavorite) {
    setLastProp(isFavorite);
    setFavorite(isFavorite);
  }

  const addToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dish.available) return;
    add({
      menuItemId: dish.id,
      slug: dish.slug,
      name: dish.name,
      price: dish.price,
      image: dish.image,
    });
  };

  const toggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !favorite;
    setFavorite(next);
    try {
      const response = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: dish.id }),
      });
      if (response.status === 401) {
        setFavorite(!next);
        toast.error("Sign in to save favourites");
        return;
      }
      if (!response.ok) throw new Error();
      onToggleFavorite?.(dish.id, next);
    } catch {
      setFavorite(!next);
      toast.error("Couldn't update your favourites");
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-cream-100/10 bg-charcoal-900/60 transition-[border-color,transform] duration-500 hover:border-saffron-400/30",
        className,
      )}
    >
      <Link
        href={`/menu/${dish.slug}`}
        className="relative block aspect-4/3 overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        <SmartImage
          src={dish.image}
          alt={dish.name}
          seed={dish.slug}
          className="h-full w-full"
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-charcoal-950/75 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {dish.vegetarian && (
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              <Leaf className="h-2.5 w-2.5" aria-hidden />
              Veg
            </span>
          )}
          {dish.featured && (
            <span className="rounded-full bg-saffron-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal-900">
              Signature
            </span>
          )}
        </div>

        {!dish.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal-950/72 backdrop-blur-[2px]">
            <span className="rounded-full border border-cream-100/25 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cream-100">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {showFavorite && (
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${dish.name} from favourites` : `Save ${dish.name} to favourites`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-950/60 text-cream-100 backdrop-blur transition-colors hover:bg-charcoal-950/85"
        >
          <Heart
            className={cn("h-4 w-4", favorite && "fill-saffron-400 text-saffron-400")}
            aria-hidden
          />
        </button>
      )}

      <div className="flex grow flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display text-lg leading-tight text-cream-100">
            <Link
              href={`/menu/${dish.slug}`}
              className="after:absolute after:inset-0 after:content-[''] hover:text-saffron-200"
            >
              {dish.name}
            </Link>
          </h3>
          <p className="shrink-0 font-medium text-saffron-300">
            {formatCurrency(dish.price)}
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream-100/55">
          {dish.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-cream-100/50">
            <SpiceMeter level={dish.spiceLevel} />
            {dish.categoryName && (
              <span className="text-[11px] uppercase tracking-wider">
                {dish.categoryName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!dish.available}
            aria-label={`Add ${dish.name} to cart`}
            className={cn(
              "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
              dish.available
                ? "bg-saffron-400 text-charcoal-900 hover:bg-saffron-300"
                : "cursor-not-allowed bg-cream-100/8 text-cream-100/35",
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
