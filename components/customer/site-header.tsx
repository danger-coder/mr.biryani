"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/locations", label: "Locations" },
  { href: "/reservations", label: "Reserve" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  user,
}: {
  user: { name: string; role: string } | null;
}) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // The home hero sits under a transparent header; every other page needs a
  // solid one from the start.
  const overlay = pathname === "/";

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = !overlay || scrolled || open;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200 focus:rounded-full focus:bg-saffron-400 focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-charcoal-900"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-90 transition-[background-color,backdrop-filter,border-color] duration-500",
          solid
            ? "bg-charcoal-950/92 backdrop-blur-md border-b border-cream-100/10"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Link
            href="/"
            className="group flex items-baseline gap-1.5 text-cream-100"
            aria-label="Mr. Biryani — home"
          >
            <span className="display text-xl leading-none sm:text-2xl">Mr.</span>
            <span className="display text-xl leading-none text-saffron-400 sm:text-2xl">
              Biryani
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm transition-colors",
                    active
                      ? "text-saffron-300"
                      : "text-cream-100/75 hover:text-cream-100",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-px bg-saffron-400/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/menu"
              aria-label="Search the menu"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-cream-100/75 transition-colors hover:bg-cream-100/10 hover:text-cream-100 sm:flex"
            >
              <Search className="h-4 w-4" aria-hidden />
            </Link>

            <Link
              href={user ? "/account" : "/login"}
              className="hidden h-9 items-center gap-2 rounded-full px-3 text-sm text-cream-100/75 transition-colors hover:bg-cream-100/10 hover:text-cream-100 sm:flex"
            >
              <User className="h-4 w-4" aria-hidden />
              <span className="max-w-24 truncate">
                {user ? user.name.split(" ")[0] : "Sign in"}
              </span>
            </Link>

            <Link
              href="/cart"
              className="relative flex h-9 items-center gap-2 rounded-full bg-cream-100/10 px-3.5 text-sm text-cream-100 transition-colors hover:bg-cream-100/18"
              aria-label={`Cart, ${ready ? count : 0} ${count === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Cart</span>
              {ready && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-400 px-1 text-[11px] font-semibold text-charcoal-900">
                  {count}
                </span>
              )}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="text-cream-100 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-80 bg-charcoal-950 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav
          aria-label="Mobile"
          className="flex h-full flex-col justify-center gap-1 px-8 pt-16"
        >
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="display border-b border-cream-100/10 py-4 text-3xl text-cream-100 transition-colors hover:text-saffron-300"
              style={{ transitionDelay: `${index * 30}ms` }}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/menu"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
            >
              Order Now
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="rounded-full border border-cream-100/25 py-3 text-center text-sm text-cream-100"
            >
              {user ? "My Account" : "Sign in"}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
