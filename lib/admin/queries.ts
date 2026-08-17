import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

/** Shared analytics + listing queries used by the admin dashboard. */

export function startOfDay(date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysAgo(days: number): Date {
  const date = startOfDay();
  date.setDate(date.getDate() - days);
  return date;
}

/** Orders that count towards revenue — cancelled orders never do. */
const REVENUE_WHERE: Prisma.OrderWhereInput = { status: { not: "CANCELLED" } };

export async function dashboardStats() {
  const today = startOfDay();
  const yesterday = daysAgo(1);

  const [
    todaySales,
    yesterdaySales,
    todayOrders,
    yesterdayOrders,
    pendingOrders,
    customerCount,
    upcomingReservations,
    allTime,
  ] = await Promise.all([
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: today } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: yesterday, lt: today } },
      _sum: { total: true },
    }),
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    db.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.reservation.count({
      where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    db.order.aggregate({
      where: REVENUE_WHERE,
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
  ]);

  const todayRevenue = toNumber(todaySales._sum.total);
  const yesterdayRevenue = toNumber(yesterdaySales._sum.total);

  return {
    todayRevenue,
    todayOrders,
    pendingOrders,
    customerCount,
    upcomingReservations,
    totalRevenue: toNumber(allTime._sum.total),
    averageOrderValue: toNumber(allTime._avg.total),
    totalOrders: allTime._count,
    revenueChange: percentChange(todayRevenue, yesterdayRevenue),
    ordersChange: percentChange(todayOrders, yesterdayOrders),
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Revenue + order count per day for the last `days` days, oldest first. */
export async function revenueSeries(days = 14) {
  const since = daysAgo(days - 1);

  const orders = await db.order.findMany({
    where: { ...REVENUE_WHERE, createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let index = 0; index < days; index++) {
    const date = new Date(since);
    date.setDate(date.getDate() + index);
    buckets.set(date.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += toNumber(order.total);
    bucket.orders += 1;
  }

  return [...buckets.entries()].map(([date, value]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    revenue: Math.round(value.revenue),
    orders: value.orders,
  }));
}

/** Best sellers by quantity, from the frozen order-line snapshots. */
export async function popularItems(limit = 6, since?: Date) {
  const grouped = await db.orderItem.groupBy({
    by: ["menuItemId", "name"],
    where: {
      order: { ...REVENUE_WHERE, ...(since ? { createdAt: { gte: since } } : {}) },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return grouped.map((row) => ({
    menuItemId: row.menuItemId,
    name: row.name,
    quantity: row._sum.quantity ?? 0,
    revenue: toNumber(row._sum.subtotal),
  }));
}

/** Revenue split by current category of each ordered item. */
export async function revenueByCategory(since?: Date) {
  const rows = await db.orderItem.findMany({
    where: {
      menuItemId: { not: null },
      order: { ...REVENUE_WHERE, ...(since ? { createdAt: { gte: since } } : {}) },
    },
    select: {
      subtotal: true,
      menuItem: { select: { category: { select: { name: true } } } },
    },
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = row.menuItem?.category.name ?? "Other";
    totals.set(name, (totals.get(name) ?? 0) + toNumber(row.subtotal));
  }

  return [...totals.entries()]
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** New vs returning customers over a window. */
export async function customerMix(days = 30) {
  const since = daysAgo(days);

  const [newCustomers, buyers] = await Promise.all([
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since } } }),
    db.order.groupBy({
      by: ["userId"],
      where: { ...REVENUE_WHERE, userId: { not: null }, createdAt: { gte: since } },
      _count: true,
    }),
  ]);

  const returning = buyers.filter((buyer) => buyer._count > 1).length;

  return {
    newCustomers,
    activeBuyers: buyers.length,
    returningBuyers: returning,
    oneTimeBuyers: buyers.length - returning,
  };
}

/**
 * The analytics window the admin has selected. Kept small and validated so a
 * crafted query string can't ask the database for an unbounded scan.
 */
export const RANGES = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "14", label: "Last 14 days", days: 14 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
] as const;

export type RangeValue = (typeof RANGES)[number]["value"];

export function resolveRange(value: string | undefined) {
  return RANGES.find((range) => range.value === value) ?? RANGES[1];
}

export async function salesTotals() {
  const [day, week, month] = await Promise.all([
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: startOfDay() } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: daysAgo(6) } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: daysAgo(29) } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return {
    daily: { revenue: toNumber(day._sum.total), orders: day._count },
    weekly: { revenue: toNumber(week._sum.total), orders: week._count },
    monthly: { revenue: toNumber(month._sum.total), orders: month._count },
  };
}
