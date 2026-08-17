import Link from "next/link";
import { ArrowRight, Clock, Flame, MapPin, Sparkles, Utensils } from "lucide-react";
import { db } from "@/lib/db";
import { toNumber, cn } from "@/lib/utils";
import { IMAGES, VIDEOS } from "@/lib/assets";
import { Hero } from "@/components/customer/hero";
import { FeaturedRail } from "@/components/customer/featured-rail";
import { CinematicVideo } from "@/components/media/cinematic-video";
import { SmartImage } from "@/components/media/smart-image";
import { buttonVariants } from "@/components/ui/button-variants";
import { Stars } from "@/components/ui/primitives";
import type { DishSummary } from "@/components/menu/dish-card";

export const revalidate = 60;

const CRAFT = [
  {
    icon: Flame,
    title: "Live coal, never gas",
    body: "Every handi is finished over charcoal. It is slower, it is harder, and it is the entire difference.",
  },
  {
    icon: Clock,
    title: "Three hours on dum",
    body: "Sealed under dough so nothing escapes — the rice cooks in the steam of the meat below it.",
  },
  {
    icon: Sparkles,
    title: "Kashmiri saffron",
    body: "Bloomed in warm milk, added by hand in the final layer. You can smell it before the lid comes off.",
  },
];

export default async function HomePage() {
  const [featured, categories, reviews, locations, ratingAgg] = await Promise.all([
    db.menuItem.findMany({
      where: { featured: true, available: true, category: { active: true } },
      orderBy: { sortOrder: "asc" },
      take: 8,
      include: { category: { select: { name: true } } },
    }),
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { menuItems: { where: { available: true } } } } },
    }),
    db.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: { select: { name: true } },
        menuItem: { select: { name: true } },
      },
    }),
    db.restaurantLocation.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      take: 3,
    }),
    db.review.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const dishes: DishSummary[] = featured.map((item) => ({
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

  const rating = ratingAgg._avg.rating ?? 4.9;

  return (
    <>
      <Hero rating={rating} reviewCount={ratingAgg._count} />

      {/* ------------------------------------------------ marquee value strip */}
      <section className="border-y border-cream-100/10 bg-charcoal-900" aria-label="What we promise">
        <div className="mx-auto grid max-w-7xl gap-px px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {CRAFT.map((entry, index) => (
            <div
              key={entry.title}
              data-reveal
              data-reveal-delay={index * 0.08}
              className={cn(
                "flex gap-4 py-8 lg:px-8",
                index > 0 && "border-t border-cream-100/10 lg:border-l lg:border-t-0",
              )}
            >
              <entry.icon className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" aria-hidden />
              <div>
                <h2 className="text-sm font-semibold text-cream-100">{entry.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-cream-100/55">
                  {entry.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- signature rail */}
      <section className="py-20 lg:py-28" aria-labelledby="signature-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div data-reveal className="max-w-2xl">
              <p className="eyebrow text-saffron-400">The Signatures</p>
              <h2
                id="signature-heading"
                className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] text-cream-100"
              >
                Dishes people come back for.
              </h2>
            </div>
            <Link
              href="/menu"
              data-reveal
              className="group inline-flex items-center gap-2 text-sm text-saffron-300 transition-colors hover:text-saffron-200"
            >
              See the full menu
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <FeaturedRail dishes={dishes} />
        </div>
      </section>

      {/* --------------------------------------------- sticky dum storytelling */}
      <section
        className="relative border-y border-cream-100/10 bg-charcoal-900/40"
        aria-labelledby="dum-heading"
      >
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="relative min-h-[60vh] lg:min-h-[110vh]">
            <div className="lg:sticky lg:top-0 lg:h-screen">
              <CinematicVideo
                src={VIDEOS.dum}
                poster={IMAGES.storyDum}
                alt="Dough being pressed around the rim of a handi to seal it"
                seed="dum-cooking"
                className="h-[60vh] w-full lg:h-screen"
                overlayClassName="bg-linear-to-r from-charcoal-950/50 to-transparent lg:bg-linear-to-l"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-16 px-4 py-20 sm:px-6 lg:px-14 lg:py-32">
            <div data-reveal>
              <p className="eyebrow text-saffron-400">The Method</p>
              <h2
                id="dum-heading"
                className="display mt-4 text-[clamp(2rem,4.5vw,3.25rem)] text-cream-100"
              >
                Sealed shut.
                <br />
                Opened once.
              </h2>
              <p className="prose-warm mt-6 max-w-md text-cream-100/60">
                Dum is not a technique you can rush. The pot is sealed with dough,
                set on low coal, and left alone. No stirring, no checking, no
                lifting the lid to see how it&rsquo;s going. Every bit of steam that
                would have escaped instead goes back into the rice.
              </p>
            </div>

            <ol className="space-y-10">
              {[
                {
                  step: "01",
                  title: "The marinade",
                  body: "Yoghurt, green chilli, ginger and garlic. Overnight, minimum — twelve hours for mutton.",
                },
                {
                  step: "02",
                  title: "The layers",
                  body: "Par-boiled sella basmati over the meat, then fried onion, mint, saffron milk and ghee.",
                },
                {
                  step: "03",
                  title: "The seal",
                  body: "Dough pressed around the rim. From here nothing goes in and nothing comes out.",
                },
                {
                  step: "04",
                  title: "The wait",
                  body: "Three hours on low coal, with a tawa underneath so the bottom never catches.",
                },
              ].map((entry) => (
                <li key={entry.step} data-reveal className="flex gap-5">
                  <span className="display shrink-0 text-2xl text-saffron-400/40">
                    {entry.step}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-cream-100">{entry.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-cream-100/55">
                      {entry.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ categories */}
      <section className="py-20 lg:py-28" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal className="max-w-2xl">
            <p className="eyebrow text-saffron-400">The Menu</p>
            <h2
              id="categories-heading"
              className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] text-cream-100"
            >
              Everything on the table.
            </h2>
          </div>

          <div
            data-reveal-stagger
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/menu?category=${category.slug}`}
                className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-cream-100/10 transition-colors hover:border-saffron-400/30"
              >
                <SmartImage
                  src={category.image}
                  alt=""
                  seed={category.slug}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="display text-2xl text-cream-100">{category.name}</h3>
                  <p className="mt-1 text-xs text-cream-100/50">
                    {category._count.menuItems}{" "}
                    {category._count.menuItems === 1 ? "dish" : "dishes"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- reviews */}
      {reviews.length > 0 && (
        <section
          className="border-y border-cream-100/10 bg-charcoal-900/40 py-20 lg:py-28"
          aria-labelledby="reviews-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-saffron-400">In Their Words</p>
                <h2
                  id="reviews-heading"
                  className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] text-cream-100"
                >
                  {rating.toFixed(1)} out of 5.
                </h2>
              </div>
              <Stars rating={rating} size={20} />
            </div>

            <div data-reveal-stagger className="mt-12 grid gap-5 lg:grid-cols-3">
              {reviews.map((review) => (
                <figure
                  key={review.id}
                  className="flex flex-col rounded-2xl border border-cream-100/10 bg-charcoal-950/50 p-6"
                >
                  <Stars rating={review.rating} />
                  <blockquote className="mt-4 grow text-sm leading-relaxed text-cream-100/70">
                    &ldquo;{review.comment}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-cream-100/10 pt-4 text-xs text-cream-100/45">
                    <span className="text-cream-100/80">{review.user.name}</span>
                    {review.menuItem && <> · on {review.menuItem.name}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- locations */}
      {locations.length > 0 && (
        <section className="py-20 lg:py-28" aria-labelledby="locations-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div data-reveal className="max-w-2xl">
              <p className="eyebrow text-saffron-400">Find Us</p>
              <h2
                id="locations-heading"
                className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] text-cream-100"
              >
                Three rooms, one kitchen standard.
              </h2>
            </div>

            <div data-reveal-stagger className="mt-12 grid gap-5 lg:grid-cols-3">
              {locations.map((location) => (
                <article
                  key={location.id}
                  className="overflow-hidden rounded-2xl border border-cream-100/10 bg-charcoal-900/50"
                >
                  <SmartImage
                    src={location.image}
                    alt={location.name}
                    seed={location.slug}
                    className="aspect-16/10 w-full"
                    sizes="(max-width: 1024px) 90vw, 30vw"
                  />
                  <div className="p-6">
                    <h3 className="display text-xl text-cream-100">
                      {location.name.replace("Mr. Biryani — ", "")}
                    </h3>
                    <p className="mt-2 flex items-start gap-2 text-sm text-cream-100/55">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {location.address}, {location.city}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-cream-100/45">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {location.openingHours}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- CTA band */}
      <section className="relative overflow-hidden" aria-labelledby="cta-heading">
        <CinematicVideo
          src={VIDEOS.closeup}
          poster={IMAGES.ctaBanner}
          alt=""
          seed="handi-closeup"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-charcoal-950/78" aria-hidden />

        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <Utensils className="mx-auto h-6 w-6 text-saffron-400" aria-hidden />
          <h2
            id="cta-heading"
            data-reveal
            className="display mt-6 text-[clamp(2.25rem,6vw,4rem)] text-cream-100"
          >
            Hungry yet?
          </h2>
          <p data-reveal className="mx-auto mt-5 max-w-lg text-cream-100/65">
            Delivery across the valley in under 45 minutes, or reserve a table and
            let us open the handi in front of you.
          </p>
          <div data-reveal className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "xl" })}>
              Order Now
            </Link>
            <Link
              href="/reservations"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-cream-100/30 text-cream-100 hover:border-cream-100/60",
              )}
            >
              Book a Table
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
