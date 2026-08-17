import { CartProvider } from "@/components/cart/cart-provider";
import { RevealProvider } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/customer/site-header";
import { SiteFooter } from "@/components/customer/site-footer";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="brand-surface min-h-dvh flex flex-col">
      <CartProvider>
        <RevealProvider>
          <SiteHeader
            user={user ? { name: user.name, role: user.role } : null}
          />
          <main id="main" className="grow">
            {children}
          </main>
          <SiteFooter />
        </RevealProvider>
      </CartProvider>
    </div>
  );
}
