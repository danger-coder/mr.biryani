import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SmartImage } from "@/components/media/smart-image";
import { IMAGES } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Mr. Biryani — phone, email and the address of every restaurant.",
};

export default async function ContactPage() {
  const [settings, locations] = await Promise.all([
    getSettings(),
    db.restaurantLocation.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="eyebrow text-saffron-400">Contact</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Talk to us.
          </h1>
          <p className="mt-5 text-cream-100/60">
            For orders, bookings, large parties or anything that went wrong — the
            fastest route is the phone.
          </p>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="space-y-6">
            <a
              href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}
              className="flex items-start gap-4 rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6 transition-colors hover:border-saffron-400/30"
            >
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-cream-100">Call us</span>
                <span className="mt-1 block text-sm text-cream-100/55">
                  {settings.supportPhone}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${settings.supportEmail}`}
              className="flex items-start gap-4 rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6 transition-colors hover:border-saffron-400/30"
            >
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-cream-100">Email us</span>
                <span className="mt-1 block text-sm text-cream-100/55">
                  {settings.supportEmail}
                </span>
              </span>
            </a>

            <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-6">
              <Clock className="h-5 w-5 text-saffron-400" aria-hidden />
              <p className="mt-4 text-sm font-medium text-cream-100">Kitchen hours</p>
              <p className="mt-1 text-sm text-cream-100/55">
                Every day, 11:00 – 23:00. Last biryani order at 22:15 — the dum
                cannot be rushed.
              </p>
            </div>
          </div>

          <div>
            <SmartImage
              src={IMAGES.interior}
              alt="The Mr. Biryani dining room"
              seed="restaurant-interior"
              className="aspect-16/10 w-full rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {locations.map((location) => (
                <li
                  key={location.id}
                  className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40 p-5"
                >
                  <h2 className="text-sm font-medium text-cream-100">
                    {location.name.replace("Mr. Biryani — ", "")}
                  </h2>
                  <p className="mt-2 flex items-start gap-2 text-sm text-cream-100/55">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {location.address}, {location.city}
                  </p>
                  <a
                    href={`tel:${location.phone.replace(/\s/g, "")}`}
                    className="mt-2 inline-block text-sm text-saffron-300 underline-offset-4 hover:underline"
                  >
                    {location.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
