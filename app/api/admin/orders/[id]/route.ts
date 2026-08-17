import { db } from "@/lib/db";
import { orderStatusSchema, paymentStatusSchema } from "@/lib/validations/order";
import { canTransition, STATUS_LABEL } from "@/lib/orders/status";
import { notify } from "@/lib/notifications";
import {
  ok,
  fail,
  notFound,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";
import { toNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        location: { select: { name: true, city: true } },
      },
    });
    if (!order) return notFound("Order");
    return ok({ order });
  } catch (error) {
    return serverError(error);
  }
}

/** Status transition. The state machine is enforced here, not in the UI. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, orderStatusSchema);
  if (!parsed.ok) return parsed.response;

  const nextStatus = parsed.data.status;

  try {
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        orderType: true,
        userId: true,
        total: true,
        couponCode: true,
      },
    });
    if (!order) return notFound("Order");

    if (order.status === nextStatus) {
      return fail(`This order is already ${STATUS_LABEL[nextStatus]}.`, 409);
    }

    if (!canTransition(order.status, nextStatus, order.orderType)) {
      return fail(
        `An order can't go from ${STATUS_LABEL[order.status]} to ${STATUS_LABEL[nextStatus]}.`,
        409,
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          // Delivered cash orders are settled on handover.
          ...(nextStatus === "DELIVERED" ? { paymentStatus: "PAID" as const } : {}),
          events: {
            create: { status: nextStatus, note: parsed.data.note || null },
          },
        },
        select: { id: true, status: true, paymentStatus: true },
      });

      // Cancelling releases the coupon use so it isn't spent on a dead order.
      if (nextStatus === "CANCELLED" && order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      if (order.userId) {
        await notify({
          tx,
          userId: order.userId,
          type: "ORDER",
          title:
            nextStatus === "CANCELLED"
              ? "Order Cancelled"
              : `Order ${STATUS_LABEL[nextStatus]}`,
          message: customerMessage(nextStatus, order.orderNumber),
          link: `/account/orders/${order.id}`,
        });
      }

      return result;
    });

    return ok({ order: updated });
  } catch (error) {
    return serverError(error);
  }
}

function customerMessage(status: string, orderNumber: string): string {
  switch (status) {
    case "CONFIRMED":
      return `Your order #${orderNumber} has been confirmed.`;
    case "PREPARING":
      return `Your order #${orderNumber} is being prepared.`;
    case "READY":
      return `Your order #${orderNumber} is ready for pickup.`;
    case "OUT_FOR_DELIVERY":
      return `Your order #${orderNumber} is on its way.`;
    case "DELIVERED":
      return `Your order #${orderNumber} has been delivered. We hope it was unforgettable.`;
    case "CANCELLED":
      return `Your order #${orderNumber} has been cancelled. Please get in touch if this is unexpected.`;
    default:
      return `Your order #${orderNumber} has been updated.`;
  }
}

/** Payment status, kept separate from fulfilment status. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, paymentStatusSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const existing = await db.order.findUnique({
      where: { id },
      select: { id: true, total: true },
    });
    if (!existing) return notFound("Order");

    const order = await db.order.update({
      where: { id },
      data: { paymentStatus: parsed.data.paymentStatus },
      select: { id: true, paymentStatus: true, total: true },
    });

    return ok({ order: { ...order, total: toNumber(order.total) } });
  } catch (error) {
    return serverError(error);
  }
}
