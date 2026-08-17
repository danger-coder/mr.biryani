import "server-only";

import type { OrderType, PaymentMethod, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { priceCart, type CartInput, type PricingIssue } from "@/lib/pricing";
import { notify } from "@/lib/notifications";
import { getSettings, settingBool } from "@/lib/settings";

export type CreateOrderInput = {
  userId: string | null;
  items: CartInput;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  city?: string | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  notes?: string | null;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; total: number }
  | { ok: false; message: string; issues?: PricingIssue[] };

async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<
    { nextval: bigint }[]
  >`SELECT nextval('order_number_seq') AS nextval`;
  return `MB${rows[0].nextval.toString()}`;
}

/**
 * Creates an order atomically.
 *
 * Everything that matters is re-derived inside the transaction: the items must
 * exist and be available, prices come from the menu table, the coupon is
 * re-validated and its usage counter incremented under the same lock. If any
 * step throws, nothing is written — there is no such thing as a half order.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const settings = await getSettings();
  if (!settingBool(settings, "orderingEnabled")) {
    return { ok: false, message: "Online ordering is temporarily paused." };
  }

  if (input.orderType === "DELIVERY" && !input.deliveryAddress?.trim()) {
    return { ok: false, message: "A delivery address is required for delivery orders." };
  }

  // The sequence is the only source of order numbers, so a collision should be
  // impossible. It can still happen if rows were inserted out of band (an
  // import, a restored backup) and left the sequence behind. Rather than fail
  // the customer's order, take the next number and try again.
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await attemptOrder(input);
    if (result !== ORDER_NUMBER_COLLISION) return result;
  }

  return {
    ok: false,
    message: "We couldn't assign an order number. Please try again.",
  };
}

const ORDER_NUMBER_COLLISION = Symbol("order-number-collision");

function isOrderNumberCollision(error: unknown): boolean {
  const candidate = error as { code?: string; meta?: { target?: unknown } };
  if (candidate?.code !== "P2002") return false;
  const target = candidate.meta?.target;
  return Array.isArray(target) && target.includes("orderNumber");
}

async function attemptOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult | typeof ORDER_NUMBER_COLLISION> {
  try {
    return await db.$transaction(async (tx) => {
      // Server-side pricing. Anything the client claimed about money is ignored.
      const priced = await priceCart(input.items, {
        orderType: input.orderType,
        couponCode: input.couponCode,
        tx,
      });

      const blocking = priced.issues;
      if (blocking.length > 0) {
        return {
          ok: false as const,
          message: blocking[0].message,
          issues: blocking,
        };
      }

      // A coupon that failed validation must not silently become "no discount"
      // on an order the customer expected to be discounted.
      if (input.couponCode?.trim() && priced.couponError) {
        return { ok: false as const, message: priced.couponError };
      }

      const orderNumber = await nextOrderNumber(tx);

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          customerEmail: input.customerEmail?.trim() || null,
          deliveryAddress:
            input.orderType === "DELIVERY"
              ? input.deliveryAddress?.trim() || null
              : null,
          city: input.orderType === "DELIVERY" ? input.city?.trim() || null : null,
          orderType: input.orderType,
          paymentMethod: input.paymentMethod,
          // Nothing has actually been charged — see lib/payments.
          paymentStatus: "UNPAID",
          status: "PENDING",
          couponCode: priced.coupon?.code ?? null,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
          discount: priced.discount,
          total: priced.total,
          notes: input.notes?.trim() || null,
          items: {
            create: priced.lines.map((line) => ({
              menuItemId: line.menuItemId,
              // Snapshot: these never change, even if the menu does.
              name: line.name,
              price: line.unitPrice,
              quantity: line.quantity,
              subtotal: line.subtotal,
              image: line.image,
            })),
          },
          events: {
            create: { status: "PENDING", note: "Order placed." },
          },
        },
        select: { id: true, orderNumber: true, total: true },
      });

      if (priced.coupon) {
        await tx.coupon.update({
          where: { code: priced.coupon.code },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (input.userId) {
        await notify({
          tx,
          userId: input.userId,
          type: "ORDER",
          title: "Order Placed",
          message: `We've received your order #${orderNumber}. We'll confirm it shortly.`,
          link: `/account/orders/${order.id}`,
        });
      }

      await notify({
        tx,
        forAdmin: true,
        type: "ORDER",
        title: "New Order",
        message: `A new order #${orderNumber} has been placed for Rs. ${Number(
          order.total,
        ).toLocaleString("en-IN")}.`,
        link: `/admin/orders/${order.id}`,
      });

      return {
        ok: true as const,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
      };
    });
  } catch (error) {
    if (isOrderNumberCollision(error)) return ORDER_NUMBER_COLLISION;
    console.error("[createOrder]", error);
    return { ok: false, message: "We couldn't place your order. Please try again." };
  }
}
