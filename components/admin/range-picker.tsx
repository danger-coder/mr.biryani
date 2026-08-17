"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Analytics window selector. Writes to the URL so a chosen range is linkable and
 * survives a refresh, and the server does the aggregation for exactly that
 * window. Values are validated server-side against a fixed list.
 */
export function RangePicker({
  ranges,
  active,
}: {
  ranges: readonly { value: string; label: string }[];
  active: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
      role="group"
      aria-label="Analytics date range"
    >
      {ranges.map((range) => {
        const selected = range.value === active;
        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.set("range", range.value);
              router.replace(`${pathname}?${next.toString()}`, { scroll: false });
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
