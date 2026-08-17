"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";
import { allowedTransitions, STATUS_LABEL, PAYMENT_LABEL } from "@/lib/orders/status";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Select } from "@/components/ui/field";

/**
 * Status controls for one order.
 *
 * The buttons shown come from the same state machine the API enforces, so the UI
 * can never offer a transition the server would reject. Cancelling — the only
 * irreversible action here — always asks first.
 */
export function OrderActions({
  orderId,
  status,
  orderType,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<OrderStatus | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [payment, setPayment] = React.useState<PaymentStatus>(paymentStatus);

  const next = allowedTransitions(status, orderType);
  const forward = next.filter((entry) => entry !== "CANCELLED");
  const canCancel = next.includes("CANCELLED");

  async function move(target: OrderStatus) {
    setBusy(target);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Couldn't update this order");
        return;
      }

      toast.success("Order status updated", {
        description: `Now ${STATUS_LABEL[target]}.`,
      });
      setConfirming(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function updatePayment(value: PaymentStatus) {
    const previous = payment;
    setPayment(value);
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: value }),
    });
    if (!response.ok) {
      setPayment(previous);
      toast.error("Couldn't update the payment status");
      return;
    }
    toast.success(`Payment marked ${PAYMENT_LABEL[value].toLowerCase()}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-500">Move this order forward</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {forward.length === 0 ? (
            <p className="text-sm text-slate-500">
              {status === "DELIVERED"
                ? "This order is complete."
                : "This order was cancelled and can't be changed."}
            </p>
          ) : (
            forward.map((target) => (
              <Button
                key={target}
                variant={target === "DELIVERED" ? "success" : "solid"}
                size="sm"
                loading={busy === target}
                onClick={() => move(target)}
              >
                Mark {STATUS_LABEL[target]}
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
        <div>
          <label
            htmlFor="payment-status"
            className="mb-1.5 block text-xs font-medium text-slate-500"
          >
            Payment status
          </label>
          <Select
            id="payment-status"
            value={payment}
            onChange={(event) => updatePayment(event.target.value as PaymentStatus)}
            className="w-44"
          >
            {(["UNPAID", "PAID", "REFUNDED", "FAILED"] as const).map((value) => (
              <option key={value} value={value}>
                {PAYMENT_LABEL[value]}
              </option>
            ))}
          </Select>
        </div>

        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Print order
        </Button>

        {canCancel && (
          <Button
            variant="danger"
            className="ml-auto"
            onClick={() => setConfirming(true)}
            loading={busy === "CANCELLED"}
          >
            Cancel order
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => move("CANCELLED")}
        loading={busy === "CANCELLED"}
        title="Cancel this order?"
        message="The customer is notified immediately and any coupon they used is released back for reuse. A cancelled order cannot be reopened."
        confirmLabel="Cancel order"
      />
    </div>
  );
}
