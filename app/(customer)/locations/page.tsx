import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { SmartImage } from "@/components/media/smart-image";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Our restaurants",
  description:
    "Find Mr. Biryani in Kathmandu, Lalitpur and Pokhara — addresses, opening hours and phone numbers.",
};

export const revalidate = 300;

export default async function LocationsPage() {
  const locations = await db.restaurantLocation.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="eyebrow text-saffron-400">Find us</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Three rooms.
          </h1>
          <p className="mt-5 text-cream-100/60">
            Same kitchen standard, same coal, same three hours on dum.
          </p>
        </header>

        {locations.length === 0 ? (
          <div className="mt-14 rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
            <EmptyState
              tone="brand"
              icon={<MapPin className="h-6 w-6" />}
              title="Locations are being updated."
              message="Check back shortly, or get in touch and we'll point you to the nearest kitchen."
            />
          </div>
        ) : (
          <div className="mt-14 space-y-6">
            {locations.map((location, index) => (
              <article
                key={location.id}
                data-reveal
                className="grid overflow-hidden rounded-2xl border border-cream-100/10 bg-charcoal-900/40 lg:grid-cols-2"
              >
                <SmartImage
                  src={location.image}
                  alt={location.name}
                  seed={location.slug}
                  className={`aspect-16/10 w-full lg:aspect-auto lg:min-h-72 ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                <div className="p-7 sm:p-10">
                  <h2 className="display text-3xl text-cream-100">
                    {location.name.replace("Mr. Biryani — ", "")}
                  </h2>

                  <dl className="mt-6 space-y-3.5 text-sm">
                    <div className="flex items-start gap-3">
                      <dt className="sr-only">Address</dt>
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" aria-hidden />
                      <dd className="text-cream-100/70">
                        {location.address}, {location.city}
                      </dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="sr-only">Opening hours</dt>
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" aria-hidden />
                      <dd className="text-cream-100/70">{location.openingHours}</dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="sr-only">Phone</dt>
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" aria-hidden />
                      <dd>
                        <a
                          href={`tel:${location.phone.replace(/\s/g, "")}`}
                          className="text-cream-100/70 transition-colors hover:text-saffron-300"
                        >
                          {location.phone}
                        </a>
                      </dd>
                    </div>
                    {location.email && (
                      <div className="flex items-start gap-3">
                        <dt className="sr-only">Email</dt>
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" aria-hidden />
                        <dd>
                          <a
                            href={`mailto:${location.email}`}
                            className="text-cream-100/70 transition-colors hover:text-saffron-300"
                          >
                            {location.email}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/reservations"
                      className={buttonVariants({ variant: "primary", size: "lg" })}
                    >
                      Book a table
                    </Link>
                    {location.latitude && location.longitude && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`${buttonVariants({ variant: "outline", size: "lg" })} border-cream-100/25 text-cream-100`}
                      >
                        View on map
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
