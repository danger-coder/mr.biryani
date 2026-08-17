import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Leaf, Timer, Users } from "lucide-react";
import { IMAGES, VIDEOS } from "@/lib/assets";
import { CinematicVideo } from "@/components/media/cinematic-video";
import { SmartImage } from "@/components/media/smart-image";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who we are, how we cook, and why the biryani takes three hours longer than it has to.",
};

const VALUES = [
  {
    icon: Flame,
    title: "Charcoal, not shortcuts",
    body: "Gas is faster and cheaper. It also cannot give you the base note that a coal fire does, so we don't use it.",
  },
  {
    icon: Timer,
    title: "Time as an ingredient",
    body: "Marinades sit overnight. Dal simmers overnight. The dum takes three hours. None of it can be hurried.",
  },
  {
    icon: Leaf,
    title: "Bought fresh, daily",
    body: "Meat and vegetables arrive each morning. Nothing is frozen, which is why the menu occasionally runs short.",
  },
  {
    icon: Users,
    title: "Cooked by people who eat it",
    body: "Our kitchen team eats the same food, off the same handi, every service.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="eyebrow text-saffron-400">About</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            We only really cook one thing well.
          </h1>
          <p className="prose-warm mt-6 max-w-xl text-cream-100/60">
            Everything else on the menu exists to sit next to the biryani. That is
            not modesty — it is the whole strategy. A kitchen that tries to be good
            at forty dishes is rarely excellent at any of them.
          </p>
        </header>
      </div>

      <div className="mt-16 lg:mt-24">
        <CinematicVideo
          src={VIDEOS.chef}
          poster={IMAGES.storyChef}
          alt="A chef layering saffron rice over marinated meat"
          seed="chef-cooking"
          className="aspect-video w-full lg:aspect-21/9"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mt-20 lg:mt-28" aria-labelledby="values-heading">
          <h2 id="values-heading" className="display text-[clamp(2rem,5vw,3.25rem)] text-cream-100">
            How we work.
          </h2>

          <div data-reveal-stagger className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-7"
              >
                <value.icon className="h-5 w-5 text-saffron-400" aria-hidden />
                <h3 className="mt-5 text-lg font-medium text-cream-100">{value.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-cream-100/55">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:mt-28 lg:grid-cols-2 lg:gap-16" aria-labelledby="room-heading">
          <SmartImage
            src={IMAGES.interiorAlt}
            alt="The dining room, lit low, with brass and dark wood"
            seed="restaurant-interior-2"
            className="aspect-4/3 w-full rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
          <div className="flex flex-col justify-center">
            <h2 id="room-heading" className="display text-[clamp(2rem,4.5vw,3rem)] text-cream-100">
              The room.
            </h2>
            <p className="prose-warm mt-6 text-cream-100/60">
              Low light, brass, dark wood, and tables far enough apart to have a
              conversation. We built rooms for long meals rather than fast ones,
              which is also why the handi arrives sealed and gets opened at your
              table.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/story" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Read our story
              </Link>
              <Link
                href="/locations"
                className={`${buttonVariants({ variant: "outline", size: "lg" })} border-cream-100/25 text-cream-100`}
              >
                Find a table
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
