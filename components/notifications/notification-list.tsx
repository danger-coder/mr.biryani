"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string | Date;
};

export function NotificationList({
  notifications,
  tone = "brand",
}: {
  notifications: NotificationRow[];
  tone?: "brand" | "admin";
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const dark = tone === "brand";

  const unreadCount = notifications.filter((entry) => !entry.read).length;

  async function markRead(payload: { id?: string; all?: boolean }) {
    setBusy(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border",
          dark ? "border-cream-100/10 bg-charcoal-900/40" : "border-slate-200 bg-white",
        )}
      >
        <EmptyState
          tone={tone}
          icon={<Bell className="h-6 w-6" />}
          title="Nothing here yet."
          message={
            dark
              ? "Order updates and offers will show up here."
              : "New orders, reservations and reviews will appear here."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant={dark ? "outline" : "secondary"}
            size="sm"
            onClick={() => markRead({ all: true })}
            loading={busy}
            className={dark ? "border-cream-100/25 text-cream-100" : undefined}
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            Mark all read
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.map((notification) => {
          const body = (
            <>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    notification.read
                      ? dark
                        ? "bg-cream-100/15"
                        : "bg-slate-200"
                      : "bg-saffron-400",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 grow">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      dark ? "text-cream-100" : "text-slate-900",
                    )}
                  >
                    {notification.title}
                    {!notification.read && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-relaxed",
                      dark ? "text-cream-100/55" : "text-slate-600",
                    )}
                  >
                    {notification.message}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-xs",
                      dark ? "text-cream-100/35" : "text-slate-400",
                    )}
                  >
                    {formatDate(notification.createdAt, true)}
                  </p>
                </div>
              </div>
            </>
          );

          const className = cn(
            "block rounded-xl border p-4 transition-colors",
            dark
              ? notification.read
                ? "border-cream-100/8 bg-charcoal-900/25"
                : "border-saffron-400/25 bg-charcoal-900/50"
              : notification.read
                ? "border-slate-200 bg-white"
                : "border-amber-200 bg-amber-50/40",
            notification.link && (dark ? "hover:border-saffron-400/40" : "hover:border-slate-300"),
          );

          return (
            <li key={notification.id}>
              {notification.link ? (
                <Link
                  href={notification.link}
                  className={className}
                  onClick={() => {
                    if (!notification.read) markRead({ id: notification.id });
                  }}
                >
                  {body}
                </Link>
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
