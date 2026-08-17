"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * URL-driven filter bar shared by the admin list pages. Keeping filter state in
 * the URL means a filtered view is linkable and survives a refresh, and the
 * server does the filtering rather than the browser.
 */
export function FilterBar({
  searchPlaceholder = "Search…",
  selects = [],
  dates = false,
  className,
}: {
  searchPlaceholder?: string;
  selects?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  dates?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [draft, setDraft] = React.useState(params.get("q") ?? "");
  const [, startTransition] = React.useTransition();

  const urlQuery = params.get("q") ?? "";
  const [lastQuery, setLastQuery] = React.useState(urlQuery);

  // Resync from the URL (back button, "Clear") during render.
  if (lastQuery !== urlQuery) {
    setLastQuery(urlQuery);
    setDraft(urlQuery);
  }

  const push = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      // Any filter change returns to the first page of results.
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  React.useEffect(() => {
    if (draft === urlQuery) return;
    const timer = window.setTimeout(() => push({ q: draft || null }), 320);
    return () => window.clearTimeout(timer);
  }, [draft, urlQuery, push]);

  const activeCount = [...params.keys()].filter((key) => key !== "page").length;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-48 grow sm:max-w-xs">
        <label htmlFor="filter-search" className="sr-only">
          {searchPlaceholder}
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          id="filter-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300"
        />
      </div>

      {selects.map((select) => (
        <div key={select.key}>
          <label htmlFor={`filter-${select.key}`} className="sr-only">
            {select.label}
          </label>
          <select
            id={`filter-${select.key}`}
            value={params.get(select.key) ?? ""}
            onChange={(event) => push({ [select.key]: event.target.value || null })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-slate-300"
          >
            <option value="">{select.label}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {dates && (
        <>
          <div>
            <label htmlFor="filter-from" className="sr-only">
              From date
            </label>
            <input
              id="filter-from"
              type="date"
              value={params.get("from") ?? ""}
              onChange={(event) => push({ from: event.target.value || null })}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-slate-300"
            />
          </div>
          <div>
            <label htmlFor="filter-to" className="sr-only">
              To date
            </label>
            <input
              id="filter-to"
              type="date"
              value={params.get("to") ?? ""}
              onChange={(event) => push({ to: event.target.value || null })}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-slate-300"
            />
          </div>
        </>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear
        </button>
      )}
    </div>
  );
}

/** Sortable column header that toggles asc/desc in the URL. */
export function SortHeader({
  label,
  sortKey,
  className,
}: {
  label: string;
  sortKey: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = params.get("sort");
  const active = current === sortKey || current === `-${sortKey}`;
  const descending = current === `-${sortKey}`;

  return (
    <button
      type="button"
      onClick={() => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", active && !descending ? `-${sortKey}` : sortKey);
        next.delete("page");
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-slate-900",
        active && "text-slate-900",
        className,
      )}
    >
      {label}
      <span aria-hidden className="text-[9px]">
        {active ? (descending ? "▼" : "▲") : "↕"}
      </span>
    </button>
  );
}
