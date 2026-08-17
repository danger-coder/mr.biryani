import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <p className="eyebrow text-saffron-400">Almost there</p>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] text-cream-100">
            Your cart.
          </h1>
        </header>
        <CartView />
      </div>
    </div>
  );
}
