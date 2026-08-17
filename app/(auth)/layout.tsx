import Link from "next/link";
import { SmartImage } from "@/components/media/smart-image";
import { IMAGES } from "@/lib/assets";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-surface grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Form column */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-14">
        <Link
          href="/"
          className="flex items-baseline gap-1.5 text-cream-100"
          aria-label="Mr. Biryani — home"
        >
          <span className="display text-xl">Mr.</span>
          <span className="display text-xl text-saffron-400">Biryani</span>
        </Link>

        <main id="main" className="flex grow items-center py-12">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </main>

        <p className="text-xs text-cream-100/35">
          © {new Date().getFullYear()} Mr. Biryani
        </p>
      </div>

      {/* Editorial column — decorative, hidden from assistive tech */}
      <div className="relative hidden overflow-hidden lg:block" aria-hidden>
        <SmartImage
          src={IMAGES.interior}
          alt=""
          seed="restaurant-interior"
          className="absolute inset-0 h-full w-full"
          sizes="55vw"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-charcoal-950 via-charcoal-950/40 to-charcoal-950/20" />
        <div className="absolute inset-x-0 bottom-0 p-14">
          <p className="eyebrow text-saffron-400">Since the first handi</p>
          <p className="display mt-4 max-w-md text-4xl text-cream-100">
            Biryani made with passion.
          </p>
        </div>
      </div>
    </div>
  );
}
