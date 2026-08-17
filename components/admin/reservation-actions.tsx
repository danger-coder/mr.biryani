"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ReservationStatus } from "@prisma/client";
import { humanize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";

const NEXT: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function ReservationActions({
  reservationId,
  status,
  guestName,
}: {
  reservationId: string;
  status: ReservationStatus;
  guestName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<ReservationStatus | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const options = NEXT[status];

  async function move(next: ReservationStatus) {
    setBusy(next);
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Couldn't update this reservation");
        return;
      }

      toast.success(
        next === "CONFIRMED"
          ? "Reservation confirmed"
          : next === "CANCELLED"
            ? "Reservation cancelled"
            : "Reservation completed",
      );
      setConfirming(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (options.length === 0) {
    return (
      <span className="text-xs text-slate-400">{humanize(status)} — no actions</span>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {options
        .filter((option) => option !== "CANCELLED")
        .map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === "CONFIRMED" ? "success" : "solid"}
            loading={busy === option}
            onClick={() => move(option)}
          >
            {option === "CONFIRMED" ? "Confirm" : "Complete"}
          </Button>
        ))}

      {options.includes("CANCELLED") && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(true)}
          loading={busy === "CANCELLED"}
        >
          {status === "PENDING" ? "Reject" : "Cancel"}
        </Button>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => move("CANCELLED")}
        loading={busy === "CANCELLED"}
        title="Cancel this reservation?"
        message={`${guestName} will be notified that their table is no longer held. This can't be undone.`}
        confirmLabel="Cancel reservation"
      />
    </div>
  );
}
