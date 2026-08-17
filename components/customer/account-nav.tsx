"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  Heart,
  LogOut,
  MapPin,
  Receipt,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: Receipt },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/account/favorites", label: "Favourites", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

export function AccountNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28">
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-saffron-400/12 text-saffron-300"
                    : "text-cream-100/60 hover:bg-cream-100/5 hover:text-cream-100",
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden />
                {link.label}
                {link.href === "/account/notifications" && unread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-400 px-1 text-[11px] font-semibold text-charcoal-900">
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}

        <li className="shrink-0 lg:mt-3 lg:border-t lg:border-cream-100/10 lg:pt-3">
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm text-cream-100/55 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </li>
      </ul>
    </nav>
  );
}
