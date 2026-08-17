import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { Badge, Card, EmptyState, Pagination, Skeleton } from "@/components/ui/primitives";
import { FilterBar } from "@/components/admin/filters";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(params.status === "inactive" ? { active: false } : {}),
    ...(params.status === "active" ? { active: true } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      // Explicit select — passwordHash is never read into the page.
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        _count: { select: { orders: true, reservations: true } },
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { total: true },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const buildHref = (target: number) => {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value) as [string, string][],
    );
    next.set("page", String(target));
    return `/admin/customers?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {total} registered {total === 1 ? "customer" : "customers"}.
        </p>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-3">
          <Suspense fallback={<Skeleton className="h-9 w-64" />}>
            <FilterBar
              searchPlaceholder="Name, email or phone…"
              selects={[
                {
                  key: "status",
                  label: "All customers",
                  options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Deactivated" },
                  ],
                },
              ]}
            />
          </Suspense>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No customers found."
            message="Try a different search term."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto thin-scroll md:block">
              <table className="w-full min-w-3xl text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Phone</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Orders</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Total spent</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Registered</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => {
                    const spent = customer.orders.reduce(
                      (sum, order) => sum + toNumber(order.total),
                      0,
                    );
                    return (
                      <tr key={customer.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{customer.name}</p>
                          <p className="truncate text-xs text-slate-500">{customer.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {customer.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {customer._count.orders}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                          {formatCurrency(spent)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={customer.active ? "green" : "slate"}>
                            {customer.active ? "Active" : "Deactivated"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {customers.map((customer) => {
                const spent = customer.orders.reduce(
                  (sum, order) => sum + toNumber(order.total),
                  0,
                );
                return (
                  <li key={customer.id}>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="block p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{customer.name}</p>
                          <p className="truncate text-xs text-slate-500">{customer.email}</p>
                        </div>
                        <p className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {customer._count.orders} orders · joined {formatDate(customer.createdAt)}
                      </p>
                    </Link>
                  </li>
                );
              })}
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
