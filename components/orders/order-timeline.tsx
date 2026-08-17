import type { OrderStatus, OrderType } from "@prisma/client";
import { Check, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { STATUS_BLURB, STATUS_LABEL, trackFor } from "@/lib/orders/status";

/**
 * Vertical order timeline: Order Placed → Confirmed → Preparing → Ready →
 * Out for Delivery → Delivered. Pickup orders skip the delivery leg. A cancelled
 * order shows how far it got, then the cancellation.
 */
export function OrderTimeline({
  status,
  orderType,
  events,
  tone = "brand",
}: {
  status: OrderStatus;
  orderType: OrderType;
  events: { status: OrderStatus; createdAt: Date | string; note?: string | null }[];
  tone?: "brand" | "admin";
}) {
  const track = trackFor(orderType);
  const cancelled = status === "CANCELLED";

  const timestamps = new Map<OrderStatus, Date>();
  for (const event of events) {
    const at = typeof event.createdAt === "string" ? new Date(event.createdAt) : event.createdAt;
    if (!timestamps.has(event.status)) timestamps.set(event.status, at);
  }

  const reachedIndex = cancelled
    ? // The last tracked status it actually reached before cancellation.
      track.reduce(
        (highest, entry, index) => (timestamps.has(entry) ? index : highest),
        0,
      )
    : track.indexOf(status);

  const dark = tone === "brand";

  return (
    <ol className="relative" aria-label="Order progress">
      {track.map((entry, index) => {
        const done = index <= reachedIndex;
        const current = !cancelled && index === reachedIndex;
        const at = timestamps.get(entry);
        const last = index === track.length - 1 && !cancelled;

        return (
          <li key={entry} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px",
                  done && index < reachedIndex
                    ? "bg-saffron-400/50"
                    : dark
                      ? "bg-cream-100/12"
                      : "bg-slate-200",
                )}
                aria-hidden
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                done
                  ? "border-saffron-400 bg-saffron-400 text-charcoal-900"
                  : dark
                    ? "border-cream-100/18 text-cream-100/35"
                    : "border-slate-200 bg-white text-slate-400",
                current && "ring-4 ring-saffron-400/20",
              )}
              aria-hidden
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  done
                    ? dark
                      ? "text-cream-100"
                      : "text-slate-900"
                    : dark
                      ? "text-cream-100/40"
                      : "text-slate-400",
                )}
              >
                {STATUS_LABEL[entry]}
                {current && (
                  <span className="ml-2 text-xs font-normal text-saffron-400">
                    Current
                  </span>
                )}
              </p>
              {done && (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    dark ? "text-cream-100/45" : "text-slate-500",
                  )}
                >
                  {at ? formatDate(at, true) : STATUS_BLURB[entry]}
                </p>
              )}
            </div>
          </li>
        );
      })}

      {cancelled && (
        <li className="relative flex gap-4">
          <span
            className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-500 bg-red-500 text-white"
            aria-hidden
          >
            <X className="h-3.5 w-3.5" />
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-medium text-red-400">Cancelled</p>
            <p className={cn("mt-0.5 text-xs", dark ? "text-cream-100/45" : "text-slate-500")}>
              {timestamps.get("CANCELLED")
                ? formatDate(timestamps.get("CANCELLED")!, true)
                : STATUS_BLURB.CANCELLED}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
