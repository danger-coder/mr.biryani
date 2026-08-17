import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* Small shared building blocks. Server-safe (no client hooks). */

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?:
    | "slate"
    | "amber"
    | "blue"
    | "violet"
    | "cyan"
    | "indigo"
    | "green"
    | "red"
    | "saffron";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    saffron: "bg-saffron-400/15 text-saffron-300 border-saffron-400/25",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
  tone = "admin",
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "admin" | "brand";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-14",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            tone === "brand"
              ? "bg-saffron-400/10 text-saffron-300"
              : "bg-slate-100 text-slate-400",
          )}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-semibold",
          tone === "brand" ? "display text-2xl text-cream-100" : "text-sm text-slate-900",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1.5 max-w-sm text-sm",
          tone === "brand" ? "text-cream-100/60" : "text-slate-500",
        )}
      >
        {message}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden
          className={index < rounded ? "fill-saffron-400" : "fill-current opacity-25"}
        >
          <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.14 1 5.86L10 14.9l-5.25 2.75 1-5.86L1.5 7.65l5.9-.85z" />
        </svg>
      ))}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  buildHref,
  total,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  total?: number;
  className?: string;
}) {
  if (totalPages <= 1) {
    return total !== undefined ? (
      <div className={cn("px-4 py-3 text-xs text-slate-500", className)}>
        {total} {total === 1 ? "result" : "results"}
      </div>
    ) : null;
  }

  const window = 1;
  const pages: (number | "gap")[] = [];
  for (let index = 1; index <= totalPages; index++) {
    if (
      index === 1 ||
      index === totalPages ||
      (index >= page - window && index <= page + window)
    ) {
      pages.push(index);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3",
        className,
      )}
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages}
        {total !== undefined && ` · ${total} results`}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
          Previous
        </PageLink>
        {pages.map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="px-1.5 text-xs text-slate-400">
              …
            </span>
          ) : (
            <PageLink key={entry} href={buildHref(entry)} active={entry === page}>
              {entry}
            </PageLink>
          ),
        )}
        <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const classes = cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors",
    active
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span className={classes} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
