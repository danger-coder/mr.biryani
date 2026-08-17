import { db } from "@/lib/db";
import { dashboardStats } from "@/lib/admin/queries";
import { ok, serverError, withAdmin } from "@/lib/api";
import { toNumber } from "@/lib/utils";

/**
 * Lightweight polling endpoint for the live admin dashboard.
 *
 * Returns the headline counters plus the most recent orders so the dashboard can
 * detect a new one and announce it without a full page reload. Cheap enough to
 * call every 20 seconds; no websocket infrastructure required.
 */
export async function GET() {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [stats, recent, unread] = await Promise.all([
      dashboardStats(),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      db.notification.count({ where: { forAdmin: true, read: false } }),
    ]);

    return ok({
      stats,
      unread,
      recent: recent.map((order) => ({
        ...order,
        total: toNumber(order.total),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
