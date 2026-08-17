"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, RefreshCw } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orders/status";
import { Badge } from "@/components/ui/primitives";

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: keyof typeof STATUS_LABEL;
  total: number;
  createdAt: string;
};

/**
 * Near-real-time order feed.
 *
 * There is no websocket layer in this deployment, so the dashboard polls a small
 * JSON endpoint every 20 seconds. Polling pauses while the tab is hidden, which
 * keeps an idle dashboard from making requests all night. When a genuinely new
 * order number appears, the admin gets a toast and a short chime.
 */
const POLL_MS = 20_000;

export function LiveOrders({ initial }: { initial: RecentOrder[] }) {
  const router = useRouter();
  const [orders, setOrders] = React.useState(initial);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);
  const seen = React.useRef(new Set(initial.map((order) => order.id)));
  const firstLoad = React.useRef(true);

  const chime = React.useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return;
      const context = new AudioCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.45);
      oscillator.onended = () => context.close();
    } catch {
      // Audio is a nicety; a blocked AudioContext must never break the feed.
    }
  }, []);

  const poll = React.useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const response = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { recent: RecentOrder[] };

        const fresh = data.recent.filter((order) => !seen.current.has(order.id));
        data.recent.forEach((order) => seen.current.add(order.id));
        setOrders(data.recent);
        setLastChecked(new Date());

        if (!firstLoad.current && fresh.length > 0) {
          chime();
          for (const order of fresh.slice(0, 3)) {
            toast.success(`🔔 New Order #${order.orderNumber}`, {
              description: `${order.customerName} · ${formatCurrency(order.total)}`,
              action: {
                label: "View",
                onClick: () => router.push(`/admin/orders/${order.id}`),
              },
            });
          }
          // Refresh the surrounding server-rendered counters too.
          router.refresh();
        }
        firstLoad.current = false;
      } catch {
        // Offline or a hiccup — the next tick tries again.
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [chime, router],
  );

  React.useEffect(() => {
    firstLoad.current = false;
    let timer: number | undefined;

    const schedule = () => {
      window.clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = window.setTimeout(async () => {
        await poll();
        schedule();
      }, POLL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
        schedule();
      } else {
        window.clearTimeout(timer);
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            Recent orders
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Live
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
            {lastChecked
              ? `Checked at ${lastChecked.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : `Refreshing every ${POLL_MS / 1000} seconds`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => poll(true)}
            disabled={refreshing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              aria-hidden
            />
            Refresh
          </button>
          <Link
            href="/admin/orders"
            className="text-xs text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            All orders
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <Bell className="mx-auto h-5 w-5 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm text-slate-500">No orders yet today.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-medium text-slate-900">
                    #{order.orderNumber} · {order.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(order.createdAt, true)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[order.status] as "amber"}>
                  {STATUS_LABEL[order.status]}
                </Badge>
                <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums text-slate-900">
                  {formatCurrency(order.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
