import type { Metadata } from "next";
import Link from "next/link";
import { IMAGES, VIDEOS } from "@/lib/assets";
import { CinematicVideo } from "@/components/media/cinematic-video";
import { SmartImage } from "@/components/media/smart-image";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "One recipe, carried through three generations, and the kitchen that grew around it.",
};

const CHAPTERS = [
  {
    year: "1962",
    title: "A recipe leaves home",
    body: "Our grandmother carried one handi and a spice tin across the border. The recipe was not written down; it did not need to be. She cooked it the same way every week for forty years, and the family learned it by standing next to her.",
  },
  {
    year: "1994",
    title: "A stall on Durbar Marg",
    body: "Our father set up a single table and one coal fire. He sold out by two o'clock most days. The rule he set then is the rule now: when the biryani runs out, service is over. We do not stretch it.",
  },
  {
    year: "2016",
    title: "The first room",
    body: "We took a lease on a room with terrible plumbing and a good chimney, because the chimney mattered more. The coal fire went in before the furniture did.",
  },
  {
    year: "Today",
    title: "Three kitchens, one method",
    body: "Kathmandu, Lalitpur and Pokhara. Every kitchen runs the same marinade schedule and the same three-hour dum, and every head chef has cooked on Durbar Marg first.",
  },
];

export default function StoryPage() {
  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="eyebrow text-saffron-400">Our story</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Sixty years, one recipe.
          </h1>
        </header>
      </div>

      <div className="mt-16">
        <CinematicVideo
          src={VIDEOS.dum}
          poster={IMAGES.storyDum}
          alt="A sealed handi over coal"
          seed="dum-cooking"
          className="aspect-video w-full lg:aspect-21/9"
          overlayClassName="bg-charcoal-950/25"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="mt-20 space-y-16 lg:mt-28">
          {CHAPTERS.map((chapter, index) => (
            <li
              key={chapter.year}
              data-reveal
              className="grid gap-6 border-t border-cream-100/10 pt-10 lg:grid-cols-[10rem_1fr] lg:gap-16"
            >
              <p className="display text-3xl text-saffron-400/60">{chapter.year}</p>
              <div className="max-w-2xl">
                <h2 className="display text-2xl text-cream-100 lg:text-3xl">
                  {chapter.title}
                </h2>
                <p className="prose-warm mt-4 text-cream-100/60">{chapter.body}</p>
              </div>
              {index === 1 && (
                <div className="lg:col-start-2">
                  <SmartImage
                    src={IMAGES.aboutFounder}
                    alt="A portrait of our founder in the kitchen"
                    seed="founder-portrait"
                    className="mt-4 aspect-16/10 w-full rounded-2xl"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-20 rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-10 text-center lg:mt-28">
          <p className="display text-[clamp(1.75rem,4vw,2.75rem)] text-cream-100">
            Come and eat with us.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              See the menu
            </Link>
            <Link
              href="/reservations"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} border-cream-100/25 text-cream-100`}
            >
              Book a table
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
