import "server-only";

import type { Coupon, OrderType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings, settingNumber } from "@/lib/settings";
import { toNumber } from "@/lib/utils";

/**
 * THE pricing authority.
 *
 * The client is free to send whatever it likes; nothing it sends about money is
 * ever used. Every line price, the delivery fee, the discount and the total are
 * recomputed here from the database. Checkout and cart preview both call this,
 * so what the customer is quoted and what is charged cannot drift apart.
 */

export type CartInput = { menuItemId: string; quantity: number }[];

export type PricedLine = {
  menuItemId: string;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type PricingIssue =
  | { code: "EMPTY_CART"; message: string }
  | { code: "ITEM_MISSING"; message: string; menuItemId: string }
  | { code: "ITEM_UNAVAILABLE"; message: string; menuItemId: string }
  | { code: "BELOW_MINIMUM"; message: string }
  | { code: "COUPON_INVALID"; message: string };

export type PricedCart = {
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  coupon: { code: string; label: string } | null;
  couponError: string | null;
  minimumOrder: number;
  freeDeliveryOver: number;
  /** Blocking problems. An order must not be created while this is non-empty. */
  issues: PricingIssue[];
};

const MAX_QUANTITY_PER_LINE = 50;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function evaluateCoupon(
  coupon: Coupon | null,
  subtotal: number,
): { discount: number; error: string | null } {
  if (!coupon) return { discount: 0, error: "That coupon code is not valid." };
  if (!coupon.active) return { discount: 0, error: "This coupon is no longer active." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { discount: 0, error: "This coupon has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, error: "This coupon has reached its usage limit." };
  }

  const minimum = toNumber(coupon.minimumOrder);
  if (subtotal < minimum) {
    return {
      discount: 0,
      error: `Spend Rs. ${minimum.toLocaleString("en-IN")} to use this coupon.`,
    };
  }

  const value = toNumber(coupon.value);
  let discount =
    coupon.type === "PERCENTAGE" ? (subtotal * value) / 100 : value;

  const max = coupon.maxDiscount === null ? null : toNumber(coupon.maxDiscount);
  if (max !== null) discount = Math.min(discount, max);

  // Never discount below zero, and never more than the goods are worth.
  discount = Math.min(Math.max(discount, 0), subtotal);
  return { discount: round2(discount), error: null };
}

export function couponLabel(coupon: Coupon): string {
  return coupon.type === "PERCENTAGE"
    ? `${toNumber(coupon.value)}% off`
    : `Rs. ${toNumber(coupon.value).toLocaleString("en-IN")} off`;
}

/**
 * Prices a cart against live database state.
 * `tx` lets checkout run this inside the order transaction so prices cannot
 * change between quoting and writing the order.
 */
export async function priceCart(
  input: CartInput,
  options: {
    orderType: OrderType;
    couponCode?: string | null;
    tx?: Prisma.TransactionClient;
  },
): Promise<PricedCart> {
  const client = options.tx ?? db;
  const settings = await getSettings();
  const baseDeliveryFee = settingNumber(settings, "deliveryFee");
  const freeDeliveryOver = settingNumber(settings, "freeDeliveryOver");
  const minimumOrder = settingNumber(settings, "minimumOrder");

  const issues: PricingIssue[] = [];

  // Collapse duplicate ids and clamp quantities before touching the DB.
  const wanted = new Map<string, number>();
  for (const raw of input) {
    if (!raw?.menuItemId) continue;
    const quantity = Math.floor(Number(raw.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const next = Math.min(
      (wanted.get(raw.menuItemId) ?? 0) + quantity,
      MAX_QUANTITY_PER_LINE,
    );
    wanted.set(raw.menuItemId, next);
  }

  const empty: PricedCart = {
    lines: [],
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    coupon: null,
    couponError: null,
    minimumOrder,
    freeDeliveryOver,
    issues: [{ code: "EMPTY_CART", message: "Your cart is empty." }],
  };
  if (wanted.size === 0) return empty;

  const items = await client.menuItem.findMany({
    where: { id: { in: [...wanted.keys()] } },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      price: true,
      available: true,
      category: { select: { active: true } },
    },
  });
  const byId = new Map(items.map((item) => [item.id, item]));

  const lines: PricedLine[] = [];
  for (const [menuItemId, quantity] of wanted) {
    const item = byId.get(menuItemId);
    if (!item) {
      issues.push({
        code: "ITEM_MISSING",
        menuItemId,
        message: "An item in your cart is no longer on the menu.",
      });
      continue;
    }
    if (!item.available || !item.category.active) {
      issues.push({
        code: "ITEM_UNAVAILABLE",
        menuItemId,
        message: `${item.name} is currently unavailable.`,
      });
      continue;
    }
    const unitPrice = toNumber(item.price);
    lines.push({
      menuItemId: item.id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      unitPrice,
      quantity,
      subtotal: round2(unitPrice * quantity),
    });
  }

  if (lines.length === 0) {
    return { ...empty, issues: issues.length ? issues : empty.issues };
  }

  const subtotal = round2(lines.reduce((sum, line) => sum + line.subtotal, 0));

  const deliveryFee =
    options.orderType === "PICKUP" || subtotal >= freeDeliveryOver
      ? 0
      : baseDeliveryFee;

  let discount = 0;
  let couponError: string | null = null;
  let coupon: { code: string; label: string } | null = null;

  const code = options.couponCode?.trim().toUpperCase();
  if (code) {
    const found = await client.coupon.findUnique({ where: { code } });
    const result = evaluateCoupon(found, subtotal);
    discount = result.discount;
    couponError = result.error;
    if (found && !result.error) {
      coupon = { code: found.code, label: couponLabel(found) };
    }
  }

  if (subtotal < minimumOrder) {
    issues.push({
      code: "BELOW_MINIMUM",
      message: `The minimum order is Rs. ${minimumOrder.toLocaleString("en-IN")}.`,
    });
  }

  const total = round2(Math.max(subtotal + deliveryFee - discount, 0));

  return {
    lines,
    subtotal,
    deliveryFee: round2(deliveryFee),
    discount,
    total,
    coupon,
    couponError,
    minimumOrder,
    freeDeliveryOver,
    issues,
  };
}
