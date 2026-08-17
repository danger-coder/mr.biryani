"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  Percent,
  Settings,
  Star,
  Tags,
  UtensilsCrossed,
  Users,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { AdminSearch } from "@/components/admin/admin-search";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  user,
  pendingOrders,
  unreadNotifications,
  children,
}: {
  user: { name: string; email: string };
  pendingOrders: number;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/admin/login");
    router.refresh();
  }

  const badgeFor = (href: string) =>
    href === "/admin/orders"
      ? pendingOrders
      : href === "/admin/notifications"
        ? unreadNotifications
        : 0;

  const navList = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto thin-scroll px-3 py-4">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const badge = badgeFor(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={cn(
                      "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                      active ? "bg-white text-slate-900" : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="admin-surface min-h-dvh">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/admin" className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-900">Mr. Biryani</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Admin
            </span>
          </Link>
        </div>
        {navList}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            ← View storefront
          </Link>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-semibold text-slate-900">Mr. Biryani Admin</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {navList}
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <MenuIcon className="h-4 w-4" aria-hidden />
          </button>

          <AdminSearch />

          <Link
            href="/admin/notifications"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((value) => !value);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white"
                aria-hidden
              >
                {initials(user.name)}
              </span>
              <span className="hidden text-sm text-slate-700 sm:inline">{user.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Site settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main id="main" className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
