"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import type { ReviewStatus } from "@prisma/client";
import { formatDate, humanize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/primitives";

export type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  dishName: string | null;
  orderNumber: string | null;
};

const TONE = {
  PENDING: "amber",
  APPROVED: "green",
  HIDDEN: "slate",
} as const;

export function ReviewModeration({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<AdminReview | null>(null);

  async function setStatus(review: AdminReview, status: ReviewStatus) {
    setBusy(review.id);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        toast.error("Couldn't update this review");
        return;
      }
      toast.success(
        status === "APPROVED"
          ? "Review approved and published"
          : status === "HIDDEN"
            ? "Review hidden from the site"
            : "Review moved back to pending",
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(deleting.id);
    const response = await fetch(`/api/admin/reviews/${deleting.id}`, {
      method: "DELETE",
    });
    setBusy(null);
    setDeleting(null);

    if (!response.ok) {
      toast.error("Couldn't delete this review");
      return;
    }
    toast.success("Review deleted");
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No reviews yet."
          message="Reviews appear here once customers with delivered orders write one."
        />
      </Card>
    );
  }

  return (
    <>
      <ul className="grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Stars rating={review.rating} />
                  {review.title && (
                    <h3 className="mt-2 font-medium text-slate-900">{review.title}</h3>
                  )}
                </div>
                <Badge tone={TONE[review.status]}>{humanize(review.status)}</Badge>
              </div>

              <blockquote className="mt-3 grow text-sm leading-relaxed text-slate-600">
                {review.comment}
              </blockquote>

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p className="text-slate-700">{review.customerName}</p>
                <p className="mt-0.5">
                  {review.dishName && <>on {review.dishName} · </>}
                  {review.orderNumber && <>#{review.orderNumber} · </>}
                  {formatDate(review.createdAt)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "APPROVED" && (
                  <Button
                    size="sm"
                    variant="success"
                    loading={busy === review.id}
                    onClick={() => setStatus(review, "APPROVED")}
                  >
                    Approve
                  </Button>
                )}
                {review.status !== "HIDDEN" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy === review.id}
                    onClick={() => setStatus(review, "HIDDEN")}
                  >
                    Hide
                  </Button>
                )}
                {review.status === "HIDDEN" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setStatus(review, "PENDING")}
                  >
                    Move to pending
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  className="ml-auto"
                  onClick={() => setDeleting(review)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy === deleting?.id}
        title="Delete this review?"
        message="The review is permanently removed. If you only want it off the site, hide it instead — that keeps it on record."
        confirmLabel="Delete review"
      />
    </>
  );
}
