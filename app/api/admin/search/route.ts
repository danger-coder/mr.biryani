import { db } from "@/lib/db";
import { ok, serverError, withAdmin } from "@/lib/api";
import { toNumber } from "@/lib/utils";

/** Global admin search across orders, customers, menu items and reservations. */
export async function GET(request: Request) {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return ok({ orders: [], customers: [], menuItems: [], reservations: [] });
  }

  const contains = { contains: query, mode: "insensitive" as const };

  try {
    const [orders, customers, menuItems, reservations] = await Promise.all([
      db.order.findMany({
        where: {
          OR: [
            { orderNumber: contains },
            { customerName: contains },
            { customerPhone: contains },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          total: true,
        },
      }),
      db.user.findMany({
        where: {
          role: "CUSTOMER",
          OR: [{ name: contains }, { email: contains }, { phone: contains }],
        },
        take: 5,
        // Never select passwordHash.
        select: { id: true, name: true, email: true, phone: true },
      }),
      db.menuItem.findMany({
        where: { OR: [{ name: contains }, { description: contains }] },
        take: 5,
        select: { id: true, name: true, price: true, available: true, slug: true },
      }),
      db.reservation.findMany({
        where: { OR: [{ name: contains }, { phone: contains }] },
        orderBy: { date: "desc" },
        take: 5,
        select: { id: true, name: true, date: true, time: true, guests: true, status: true },
      }),
    ]);

    return ok({
      orders: orders.map((order) => ({ ...order, total: toNumber(order.total) })),
      customers,
      menuItems: menuItems.map((item) => ({ ...item, price: toNumber(item.price) })),
      reservations,
    });
  } catch (error) {
    return serverError(error);
  }
}
