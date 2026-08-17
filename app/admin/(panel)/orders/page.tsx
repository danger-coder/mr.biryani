import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ListOrdered } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, humanize } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, PAYMENT_LABEL } from "@/lib/orders/status";
import { Badge, Card, EmptyState, Pagination } from "@/components/ui/primitives";
import { FilterBar, SortHeader } from "@/components/admin/filters";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const STATUS_OPTIONS = (
  ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const
).map((value) => ({ value, label: STATUS_LABEL[value] }));

const PAYMENT_OPTIONS = (["UNPAID", "PAID", "REFUNDED", "FAILED"] as const).map(
  (value) => ({ value, label: PAYMENT_LABEL[value] }),
);

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";

  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(params.payment
      ? { paymentStatus: params.payment as Prisma.EnumPaymentStatusFilter["equals"] }
      : {}),
    ...(params.type ? { orderType: params.type as Prisma.EnumOrderTypeFilter["equals"] } : {}),
    ...(params.from || params.to
      ? {
          createdAt: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999`) } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerPhone: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const sort = params.sort ?? "-createdAt";
  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  const direction = descending ? "desc" : "asc";

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    field === "total"
      ? { total: direction }
      : field === "customer"
        ? { customerName: direction }
        : field === "status"
          ? { status: direction }
          : { createdAt: direction };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { items: { select: { id: true, quantity: true } } },
    }),
    db.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const buildHref = (target: number) => {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value) as [string, string][],
    );
    next.set("page", String(target));
    return `/admin/orders?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} {total === 1 ? "order" : "orders"} matching your filters.
          </p>
        </div>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-3">
          <FilterBar
            searchPlaceholder="Order number, name, phone…"
            dates
            selects={[
              { key: "status", label: "All statuses", options: STATUS_OPTIONS },
              { key: "payment", label: "All payments", options: PAYMENT_OPTIONS },
              {
                key: "type",
                label: "All types",
                options: [
                  { value: "DELIVERY", label: "Delivery" },
                  { value: "PICKUP", label: "Pickup" },
                ],
              },
            ]}
          />
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<ListOrdered className="h-6 w-6" />}
            title="No orders found."
            message="Try changing your filters, or widen the date range."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto thin-scroll md:block">
              <table className="w-full min-w-4xl text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <SortHeader label="Customer" sortKey="customer" />
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Items</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      <SortHeader label="Total" sortKey="total" />
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Payment</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <SortHeader label="Status" sortKey="status" />
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <SortHeader label="Date" sortKey="createdAt" />
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-slate-900">{order.customerName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {order.customerPhone}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          tone={
                            order.paymentStatus === "PAID"
                              ? "green"
                              : order.paymentStatus === "FAILED"
                                ? "red"
                                : "slate"
                          }
                        >
                          {PAYMENT_LABEL[order.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={STATUS_TONE[order.status] as "amber"}>
                          {STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(order.createdAt, true)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block px-4 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">#{order.orderNumber}</p>
                        <p className="mt-0.5 truncate text-sm text-slate-600">
                          {order.customerName} · {order.customerPhone}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(order.createdAt, true)} · {humanize(order.orderType)}
                        </p>
                      </div>
                      <p className="shrink-0 font-medium tabular-nums text-slate-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge tone={STATUS_TONE[order.status] as "amber"}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                      <Badge tone={order.paymentStatus === "PAID" ? "green" : "slate"}>
                        {PAYMENT_LABEL[order.paymentStatus]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              buildHref={buildHref}
            />
          </>
        )}
      </Card>
    </div>
  );
}
