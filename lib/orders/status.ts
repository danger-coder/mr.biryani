import type { OrderStatus, OrderType } from "@prisma/client";

/** The visible progress track. CANCELLED is deliberately not on it. */
export const DELIVERY_TRACK: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const PICKUP_TRACK: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
];

export function trackFor(orderType: OrderType): OrderStatus[] {
  return orderType === "PICKUP" ? PICKUP_TRACK : DELIVERY_TRACK;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Short line shown to the customer on the timeline. */
export const STATUS_BLURB: Record<OrderStatus, string> = {
  PENDING: "We've received your order and it's awaiting confirmation.",
  CONFIRMED: "The kitchen has accepted your order.",
  PREPARING: "Your biryani is on the dum right now.",
  READY: "Freshly packed and ready to go.",
  OUT_FOR_DELIVERY: "Your rider is on the way.",
  DELIVERED: "Delivered. We hope it was unforgettable.",
  CANCELLED: "This order was cancelled.",
};

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Legal next states. Enforced on the server so a crafted request can't jump an
 * order straight from PENDING to DELIVERED.
 */
export function allowedTransitions(
  current: OrderStatus,
  orderType: OrderType,
): OrderStatus[] {
  const next = TRANSITIONS[current];
  if (orderType === "PICKUP") {
    return next.filter((status) => status !== "OUT_FOR_DELIVERY");
  }
  if (current === "READY") return next.filter((status) => status !== "DELIVERED");
  return next;
}

export function canTransition(
  current: OrderStatus,
  next: OrderStatus,
  orderType: OrderType,
): boolean {
  return allowedTransitions(current, orderType).includes(next);
}

export function isTerminal(status: OrderStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

export const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  PREPARING: "violet",
  READY: "cyan",
  OUT_FOR_DELIVERY: "indigo",
  DELIVERED: "green",
  CANCELLED: "red",
};

export const PAYMENT_LABEL = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
} as const;

export const PAYMENT_METHOD_LABEL = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  ONLINE: "Online Payment",
  CARD: "Card",
} as const;
