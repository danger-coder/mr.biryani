import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { humanize } from "@/lib/utils";
import { Card, Skeleton } from "@/components/ui/primitives";
import { FilterBar } from "@/components/admin/filters";
import { ReviewModeration, type AdminReview } from "@/components/admin/review-moderation";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const where: Prisma.ReviewWhereInput = {
    ...(params.status
      ? { status: params.status as Prisma.EnumReviewStatusFilter["equals"] }
      : {}),
    ...(query
      ? {
          OR: [
            { comment: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [reviews, pending] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: {
        user: { select: { name: true, email: true } },
        menuItem: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);

  const rows: AdminReview[] = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    customerName: review.user.name,
    customerEmail: review.user.email,
    dishName: review.menuItem?.name ?? null,
    orderNumber: review.order?.orderNumber ?? null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reviews</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {pending} awaiting approval. Only approved reviews appear on the site.
        </p>
      </div>

      <Card className="p-3">
        <Suspense fallback={<Skeleton className="h-9 w-64" />}>
          <FilterBar
            searchPlaceholder="Search reviews…"
            selects={[
              {
                key: "status",
                label: "All statuses",
                options: (["PENDING", "APPROVED", "HIDDEN"] as const).map((value) => ({
                  value,
                  label: humanize(value),
                })),
              },
            ]}
          />
        </Suspense>
      </Card>

      <ReviewModeration reviews={rows} />
    </div>
  );
}
