import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/* Brand marks are inlined — the icon set we use ships no brand logos. */
function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.24a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2zm0 10.89a4.29 4.29 0 110-8.58 4.29 4.29 0 010 8.58zm8.4-11.15a1.54 1.54 0 11-3.08 0 1.54 1.54 0 013.08 0z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

const COLUMNS = [
  {
    heading: "Order",
    links: [
      { href: "/menu", label: "Full Menu" },
      { href: "/menu?category=biryani", label: "Biryani" },
      { href: "/cart", label: "Your Cart" },
      { href: "/account/orders", label: "Track an Order" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { href: "/reservations", label: "Book a Table" },
      { href: "/locations", label: "Our Restaurants" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "About Mr. Biryani" },
      { href: "/story", label: "Our Story" },
      { href: "/account", label: "My Account" },
    ],
  },
];

export async function SiteFooter() {
  const [settings, locations] = await Promise.all([
    getSettings(),
    db.restaurantLocation.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      take: 3,
      select: { id: true, name: true, address: true, city: true, phone: true },
    }),
  ]);

  return (
    <footer className="border-t border-cream-100/10 bg-charcoal-950 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <p className="display text-3xl">
              Mr. <span className="text-saffron-400">Biryani</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-100/55">
              {settings.tagline} Slow-cooked over live coal since the first handi
              came off the fire.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm text-cream-100/70">
              <a
                href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-saffron-300"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {settings.supportPhone}
              </a>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-saffron-300"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {settings.supportEmail}
              </a>
            </div>

            <div className="mt-6 flex gap-2">
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Mr. Biryani on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-100/15 transition-colors hover:border-saffron-400/50 hover:text-saffron-300"
              >
                <InstagramMark />
              </a>
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Mr. Biryani on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-100/15 transition-colors hover:border-saffron-400/50 hover:text-saffron-300"
              >
                <FacebookMark />
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="eyebrow text-saffron-400/80">{column.heading}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-cream-100/65 transition-colors hover:text-cream-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="eyebrow text-saffron-400/80">Find Us</h2>
              <ul className="mt-4 space-y-4">
                {locations.map((location) => (
                  <li key={location.id} className="text-sm leading-relaxed">
                    <p className="text-cream-100/85">
                      {location.name.replace("Mr. Biryani — ", "")}
                    </p>
                    <p className="text-cream-100/50">
                      {location.address}, {location.city}
                    </p>
                  </li>
                ))}
                {locations.length === 0 && (
                  <li className="text-sm text-cream-100/50">
                    Locations are being updated.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream-100/10 pt-6 text-xs text-cream-100/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mr. Biryani. All rights reserved.</p>
          <p>Made with a great deal of saffron.</p>
        </div>
      </div>
    </footer>
  );
}
