import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf } from "lucide-react";
import { db } from "@/lib/db";
import { toNumber, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/guards";
import { SmartImage } from "@/components/media/smart-image";
import { SpiceMeter, DishCard, type DishSummary } from "@/components/menu/dish-card";
import { AddToCartPanel } from "@/components/menu/add-to-cart-panel";
import { Stars } from "@/components/ui/primitives";

export const revalidate = 60;

async function loadDish(slug: string) {
  return db.menuItem.findFirst({
    where: { slug, category: { active: true } },
    include: {
      category: { select: { name: true, slug: true } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dish = await loadDish(slug);
  if (!dish) return { title: "Dish not found" };
  return {
    title: dish.name,
    description: dish.description.slice(0, 155),
  };
}

export default async function DishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dish, user] = await Promise.all([loadDish(slug), getCurrentUser()]);

  if (!dish) notFound();

  const [related, favorite] = await Promise.all([
    db.menuItem.findMany({
      where: {
        categoryId: dish.categoryId,
        id: { not: dish.id },
        available: true,
      },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: { category: { select: { name: true } } },
    }),
    user
      ? db.favorite.findUnique({
          where: { userId_menuItemId: { userId: user.id, menuItemId: dish.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const price = toNumber(dish.price);
  const averageRating =
    dish.reviews.length > 0
      ? dish.reviews.reduce((sum, review) => sum + review.rating, 0) / dish.reviews.length
      : null;

  const ingredients =
    dish.ingredients
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean) ?? [];

  const relatedDishes: DishSummary[] = related.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    price: toNumber(item.price),
    image: item.image,
    spiceLevel: item.spiceLevel,
    vegetarian: item.vegetarian,
    available: item.available,
    featured: item.featured,
    categoryName: item.category.name,
  }));

  return (
    <div className="pb-24 pt-24 lg:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href={`/menu?category=${dish.category.slug}`}
            className="inline-flex items-center gap-2 text-sm text-cream-100/50 transition-colors hover:text-saffron-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to {dish.category.name}
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SmartImage
              src={dish.image}
              alt={dish.name}
              seed={dish.slug}
              className="aspect-4/3 w-full rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 48vw"
              priority
            />
            {!dish.available && (
              <p className="mt-4 rounded-lg border border-cream-100/15 bg-charcoal-900/60 px-4 py-3 text-center text-sm text-cream-100/70">
                Currently Unavailable
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cream-100/15 px-3 py-1 text-[11px] uppercase tracking-widest text-cream-100/55">
                {dish.category.name}
              </span>
              {dish.vegetarian && (
                <span className="inline-flex items-center gap-1 rounded-full bg-leaf-500/20 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-leaf-400">
                  <Leaf className="h-3 w-3" aria-hidden />
                  Vegetarian
                </span>
              )}
              {dish.featured && (
                <span className="rounded-full bg-saffron-400/15 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-saffron-300">
                  Signature
                </span>
              )}
            </div>

            <h1 className="display mt-5 text-[clamp(2.25rem,5.5vw,3.75rem)] text-cream-100">
              {dish.name}
            </h1>

            {averageRating !== null && (
              <div className="mt-4 flex items-center gap-3">
                <Stars rating={averageRating} />
                <span className="text-sm text-cream-100/50">
                  {averageRating.toFixed(1)} · {dish.reviews.length}{" "}
                  {dish.reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            <p className="prose-warm mt-6 text-cream-100/65">{dish.description}</p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-cream-100/10 py-6 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-cream-100/40">
                  Spice level
                </dt>
                <dd className="mt-2">
                  <SpiceMeter level={dish.spiceLevel} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-cream-100/40">
                  Dietary
                </dt>
                <dd className="mt-2 text-sm text-cream-100/75">
                  {dish.vegetarian ? "Vegetarian" : "Contains meat or seafood"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-cream-100/40">
                  Availability
                </dt>
                <dd className="mt-2 text-sm text-cream-100/75">
                  {dish.available ? "Available now" : "Currently Unavailable"}
                </dd>
              </div>
            </dl>

            {ingredients.length > 0 && (
              <div className="mt-8">
                <h2 className="eyebrow text-saffron-400/80">Ingredients</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {ingredients.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="rounded-full border border-cream-100/12 px-3 py-1.5 text-sm text-cream-100/65"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10">
              <AddToCartPanel
                dish={{
                  id: dish.id,
                  slug: dish.slug,
                  name: dish.name,
                  price,
                  image: dish.image,
                  available: dish.available,
                }}
                signedIn={Boolean(user)}
                initiallyFavorite={Boolean(favorite)}
              />
            </div>
          </div>
        </div>

        {dish.reviews.length > 0 && (
          <section className="mt-24" aria-labelledby="dish-reviews">
            <h2 id="dish-reviews" className="display text-3xl text-cream-100">
              What people said
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dish.reviews.map((review) => (
                <figure
                  key={review.id}
                  className="rounded-2xl border border-cream-100/10 bg-charcoal-900/50 p-6"
                >
                  <Stars rating={review.rating} />
                  {review.title && (
                    <h3 className="mt-3 text-sm font-medium text-cream-100">
                      {review.title}
                    </h3>
                  )}
                  <blockquote className="mt-2 text-sm leading-relaxed text-cream-100/65">
                    {review.comment}
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-cream-100/40">
                    {review.user.name} · {formatDate(review.createdAt)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {relatedDishes.length > 0 && (
          <section className="mt-24" aria-labelledby="related-dishes">
            <h2 id="related-dishes" className="display text-3xl text-cream-100">
              Goes well with
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedDishes.map((related) => (
                <DishCard key={related.id} dish={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
