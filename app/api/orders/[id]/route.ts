import { db } from "@/lib/db";
import { ok, notFound, serverError, withUser } from "@/lib/api";
import { toNumber } from "@/lib/utils";

/**
 * A single order. Authorisation is enforced in the query itself: a customer can
 * only ever match their own rows, so guessing another order's id returns 404
 * rather than leaking its existence.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(auth.user.role === "ADMIN" ? {} : { userId: auth.user.id }),
      },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
        location: { select: { name: true, address: true, city: true, phone: true } },
      },
    });

    if (!order) return notFound("Order");

    return ok({
      order: {
        ...order,
        subtotal: toNumber(order.subtotal),
        deliveryFee: toNumber(order.deliveryFee),
        discount: toNumber(order.discount),
        total: toNumber(order.total),
        items: order.items.map((item) => ({
          ...item,
          price: toNumber(item.price),
          subtotal: toNumber(item.subtotal),
        })),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
