"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, humanize } from "@/lib/utils";

type Results = {
  orders: { id: string; orderNumber: string; customerName: string; status: string; total: number }[];
  customers: { id: string; name: string; email: string; phone: string | null }[];
  menuItems: { id: string; name: string; price: number; available: boolean; slug: string }[];
  reservations: {
    id: string;
    name: string;
    date: string;
    time: string;
    guests: number;
    status: string;
  }[];
};

const EMPTY: Results = { orders: [], customers: [], menuItems: [], reservations: [] };

/** Global admin search — orders, customers, menu items and reservations. */
export function AdminSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Results>(EMPTY);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      // Cmd/Ctrl+K focuses search from anywhere in the panel.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        containerRef.current?.querySelector("input")?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const trimmed = query.trim();
  const tooShort = trimmed.length < 2;

  React.useEffect(() => {
    // Below the minimum length there is nothing to fetch; the empty result is
    // derived below rather than written into state here.
    if (trimmed.length < 2) return;

    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
        );
        const data = await response.json();
        if (id !== requestId.current) return;
        setResults(response.ok ? data : EMPTY);
      } catch {
        if (id === requestId.current) setResults(EMPTY);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [trimmed]);

  const visible = tooShort ? EMPTY : results;
  const busy = tooShort ? false : loading;

  const total =
    visible.orders.length +
    visible.customers.length +
    visible.menuItems.length +
    visible.reservations.length;

  return (
    <div ref={containerRef} className="relative min-w-0 grow max-w-lg">
      <label htmlFor="admin-search" className="sr-only">
        Search orders, customers, menu items and reservations
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        id="admin-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search orders, customers, dishes…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && query.trim().length >= 2}
        aria-controls="admin-search-results"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
      />
      {busy && (
        <Loader2
          className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400"
          aria-hidden
        />
      )}

      {open && query.trim().length >= 2 && (
        <div
          id="admin-search-results"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto thin-scroll rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {total === 0 && !busy ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nothing matched &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="py-1">
              <Group title="Orders" show={visible.orders.length > 0}>
                {visible.orders.map((order) => (
                  <Row
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    onNavigate={() => setOpen(false)}
                    primary={`#${order.orderNumber} · ${order.customerName}`}
                    secondary={`${humanize(order.status)} · ${formatCurrency(order.total)}`}
                  />
                ))}
              </Group>

              <Group title="Customers" show={visible.customers.length > 0}>
                {visible.customers.map((customer) => (
                  <Row
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    onNavigate={() => setOpen(false)}
                    primary={customer.name}
                    secondary={customer.email}
                  />
                ))}
              </Group>

              <Group title="Menu" show={visible.menuItems.length > 0}>
                {visible.menuItems.map((item) => (
                  <Row
                    key={item.id}
                    href={`/admin/menu?q=${encodeURIComponent(item.name)}`}
                    onNavigate={() => setOpen(false)}
                    primary={item.name}
                    secondary={`${formatCurrency(item.price)} · ${
                      item.available ? "Available" : "Unavailable"
                    }`}
                  />
                ))}
              </Group>

              <Group title="Reservations" show={visible.reservations.length > 0}>
                {visible.reservations.map((reservation) => (
                  <Row
                    key={reservation.id}
                    href="/admin/reservations"
                    onNavigate={() => setOpen(false)}
                    primary={`${reservation.name} · ${reservation.guests} guests`}
                    secondary={`${formatDate(reservation.date)} at ${reservation.time} · ${humanize(
                      reservation.status,
                    )}`}
                  />
                ))}
              </Group>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  show,
  children,
}: {
  title: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="border-b border-slate-100 py-1 last:border-b-0">
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  href,
  primary,
  secondary,
  onNavigate,
}: {
  href: string;
  primary: string;
  secondary: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block px-4 py-2 transition-colors hover:bg-slate-50"
    >
      <p className="truncate text-sm text-slate-900">{primary}</p>
      <p className="truncate text-xs text-slate-500">{secondary}</p>
    </Link>
  );
}
