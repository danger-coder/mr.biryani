import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { getSettings, settingBool } from "@/lib/settings";
import { IMAGES, VIDEOS } from "@/lib/assets";
import { CinematicVideo } from "@/components/media/cinematic-video";
import { ReservationForm } from "@/components/customer/reservation-form";

export const metadata: Metadata = {
  title: "Reserve a table",
  description:
    "Book a table at Mr. Biryani in Kathmandu, Lalitpur or Pokhara. Confirmed by our team within the hour.",
};

export default async function ReservationsPage() {
  const [user, locations, settings] = await Promise.all([
    getCurrentUser(),
    db.restaurantLocation.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, city: true },
    }),
    getSettings(),
  ]);

  const open = settingBool(settings, "reservationsEnabled");

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="eyebrow text-saffron-400">Reservations</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Book a table.
          </h1>
          <p className="mt-5 text-cream-100/60">
            The handi comes to the table sealed, and we open it in front of you.
            It is worth booking ahead.
          </p>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="rounded-2xl border border-cream-100/12 bg-charcoal-900/50 p-6 sm:p-8">
            {open ? (
              <ReservationForm
                user={
                  user ? { name: user.name, email: user.email, phone: user.phone } : null
                }
                locations={locations}
              />
            ) : (
              <div className="py-10 text-center">
                <h2 className="display text-2xl text-cream-100">
                  Online bookings are closed.
                </h2>
                <p className="mt-3 text-sm text-cream-100/60">
                  Please call us on{" "}
                  <a
                    href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}
                    className="text-saffron-300 underline underline-offset-4"
                  >
                    {settings.supportPhone}
                  </a>{" "}
                  and we&rsquo;ll find you a table.
                </p>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <CinematicVideo
              src={VIDEOS.atmosphere}
              poster={IMAGES.interior}
              alt="The dining room at Mr. Biryani"
              seed="restaurant-interior"
              className="aspect-3/4 w-full rounded-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
