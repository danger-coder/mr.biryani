import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { createOrder } from "@/lib/orders/create";
import { checkoutSchema } from "@/lib/validations/order";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { toNumber } from "@/lib/utils";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

/** The signed-in customer's own orders. Never anyone else's. */
export async function GET(request: Request) {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

  try {
    const orders = await db.order.findMany({
      // Scoped by userId from the session — an id in the query string cannot
      // widen this.
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: { select: { id: true, name: true, quantity: true, price: true } },
      },
    });

    return ok({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        total: toNumber(order.total),
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: toNumber(item.price),
        })),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

/** Checkout. Guests may order; a signed-in session links the order to them. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const limit = rateLimit(await clientKey("checkout"), 12, 10 * 60 * 1000);
  if (!limit.allowed) {
    return fail("Too many checkout attempts. Please wait a moment.", 429);
  }

  const parsed = await parseBody(request, checkoutSchema);
  if (!parsed.ok) return parsed.response;

  const user = await getCurrentUser();
  const input = parsed.data;

  try {
    const result = await createOrder({
      // Ownership comes from the session, never from the request body.
      userId: user?.id ?? null,
      items: input.items,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || user?.email || null,
      deliveryAddress: input.deliveryAddress || null,
      city: input.city || null,
      orderType: input.orderType,
      paymentMethod: input.paymentMethod,
      couponCode: input.couponCode || null,
      notes: input.notes || null,
    });

    if (!result.ok) {
      return fail(result.message, 400, result.issues);
    }

    return ok(
      {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
