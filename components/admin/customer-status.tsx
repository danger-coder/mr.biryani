"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";

/** Deactivate / reactivate a customer account. */
export function CustomerStatus({
  customerId,
  name,
  active,
}: {
  customerId: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function apply(next: boolean) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Couldn't update this customer");
        return;
      }

      toast.success(next ? "Account reactivated" : "Account deactivated");
      setConfirming(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!active) {
    return (
      <Button variant="success" size="sm" loading={busy} onClick={() => apply(true)}>
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Reactivate account
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
        <Ban className="h-3.5 w-3.5" aria-hidden />
        Deactivate account
      </Button>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => apply(false)}
        loading={busy}
        title={`Deactivate ${name}?`}
        message="They will be signed out immediately and cannot sign in or order until the account is reactivated. Their past orders and reviews are kept."
        confirmLabel="Deactivate"
      />
    </>
  );
}
