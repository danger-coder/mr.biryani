"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Filters are URL state, not component state: every result set is shareable,
 * bookmarkable and survives a refresh, and the server does the filtering.
 */
export function MenuFilters({
  categories,
  resultCount,
}: {
  categories: { name: string; slug: string }[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "recommended";
  const veg = params.get("veg") === "1";

  const [draft, setDraft] = React.useState(search);
  const [pending, startTransition] = React.useTransition();

  const [lastSearch, setLastSearch] = React.useState(search);

  // Keep the box in step when the URL changes from elsewhere (back button,
  // "clear filters"), without an extra render pass.
  if (lastSearch !== search) {
    setLastSearch(search);
    setDraft(search);
  }

  const push = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  // Debounce the search box so typing doesn't fire a request per keystroke.
  React.useEffect(() => {
    if (draft === search) return;
    const timer = window.setTimeout(() => push({ search: draft || null }), 320);
    return () => window.clearTimeout(timer);
  }, [draft, search, push]);

  const hasFilters = Boolean(search || category || veg || sort !== "recommended");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative grow">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-100/35"
            aria-hidden
          />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search dishes, ingredients…"
            aria-label="Search the menu"
            className="h-12 w-full rounded-full border border-cream-100/12 bg-cream-100/5 pl-11 pr-10 text-sm text-cream-100 placeholder:text-cream-100/35 transition-colors focus:border-saffron-400/50"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-cream-100/45 hover:bg-cream-100/10 hover:text-cream-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <label className="sr-only" htmlFor="menu-sort">
            Sort dishes
          </label>
          <div className="relative">
            <SlidersHorizontal
              className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-100/35"
              aria-hidden
            />
            <select
              id="menu-sort"
              value={sort}
              onChange={(event) =>
                push({ sort: event.target.value === "recommended" ? null : event.target.value })
              }
              className="h-12 appearance-none rounded-full border border-cream-100/12 bg-cream-100/5 pl-10 pr-9 text-sm text-cream-100 focus:border-saffron-400/50"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">A–Z</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => push({ veg: veg ? null : "1" })}
            aria-pressed={veg}
            className={cn(
              "h-12 shrink-0 rounded-full border px-5 text-sm transition-colors",
              veg
                ? "border-leaf-400/50 bg-leaf-500/20 text-leaf-400"
                : "border-cream-100/12 bg-cream-100/5 text-cream-100/70 hover:text-cream-100",
            )}
          >
            Veg only
          </button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip active={!category} onClick={() => push({ category: null })}>
          All
        </FilterChip>
        {categories.map((entry) => (
          <FilterChip
            key={entry.slug}
            active={category === entry.slug}
            onClick={() => push({ category: entry.slug })}
          >
            {entry.name}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-cream-100/45">
        <p aria-live="polite" className={cn(pending && "opacity-50")}>
          {resultCount} {resultCount === 1 ? "dish" : "dishes"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              push({ search: null, category: null, sort: null, veg: null })
            }
            className="text-saffron-300 underline-offset-4 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
        active
          ? "border-saffron-400 bg-saffron-400 text-charcoal-900"
          : "border-cream-100/12 text-cream-100/65 hover:border-cream-100/30 hover:text-cream-100",
      )}
    >
      {children}
    </button>
  );
}
