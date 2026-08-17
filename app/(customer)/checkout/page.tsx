import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { paymentProvider, MOCK_PAYMENT_NOTICE } from "@/lib/payments";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  const addresses = user
    ? await db.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      })
    : [];

  const provider = paymentProvider();

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow text-saffron-400">Last step</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Checkout.
          </h1>
          {!user && (
            <p className="mt-5 text-sm text-cream-100/55">
              Ordering as a guest.{" "}
              <a
                href="/login?next=/checkout"
                className="text-saffron-300 underline underline-offset-4"
              >
                Sign in
              </a>{" "}
              to save your details and track this order.
            </p>
          )}
        </header>

        <CheckoutForm
          user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
          addresses={addresses.map((entry) => ({
            id: entry.id,
            label: entry.label,
            address: entry.address,
            city: entry.city,
            postalCode: entry.postalCode,
            isDefault: entry.isDefault,
          }))}
          paymentConfigured={provider.configured}
          paymentNotice={MOCK_PAYMENT_NOTICE}
        />
      </div>
    </div>
  );
}
