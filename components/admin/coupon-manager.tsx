"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Percent, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Toggle } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";

export type AdminCoupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minimumOrder: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

function statusOf(coupon: AdminCoupon) {
  if (!coupon.active) return { label: "Disabled", tone: "slate" as const };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { label: "Expired", tone: "red" as const };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { label: "Used up", tone: "amber" as const };
  }
  return { label: "Active", tone: "green" as const };
}

export function CouponManager({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminCoupon | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AdminCoupon | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [active, setActive] = React.useState(true);
  const [type, setType] = React.useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setErrors({});
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      code: String(form.get("code") ?? ""),
      description: String(form.get("description") ?? ""),
      type,
      value: Number(form.get("value") ?? 0),
      minimumOrder: Number(form.get("minimumOrder") ?? 0),
      maxDiscount: String(form.get("maxDiscount") ?? ""),
      expiresAt: String(form.get("expiresAt") ?? ""),
      usageLimit: String(form.get("usageLimit") ?? ""),
      active,
    };

    const response = await fetch(
      editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't save this coupon");
      return;
    }

    toast.success(editing ? "Coupon updated" : "Coupon created");
    closeForm();
    router.refresh();
  }

  async function toggleActive(coupon: AdminCoupon) {
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    if (!response.ok) {
      toast.error("Couldn't update this coupon");
      return;
    }
    toast.success(coupon.active ? "Coupon disabled" : "Coupon enabled");
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/coupons/${deleting.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    setDeleting(null);

    if (!response.ok) {
      toast.error("Couldn't delete this coupon");
      return;
    }
    toast.success("Coupon deleted");
    router.refresh();
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Coupons</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Every code is re-validated server-side at checkout.
          </p>
        </div>
        <Button
          onClick={() => {
            setActive(true);
            setType("PERCENTAGE");
            setErrors({});
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New coupon
        </Button>
      </div>

      <Card>
        {coupons.length === 0 ? (
          <EmptyState
            icon={<Percent className="h-6 w-6" />}
            title="No coupons yet."
            message="Create a discount code to run your first promotion."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto thin-scroll md:block">
              <table className="w-full min-w-3xl text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Code</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Discount</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Conditions</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Usage</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => {
                    const status = statusOf(coupon);
                    return (
                      <tr key={coupon.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {coupon.code}
                          </p>
                          {coupon.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                              {coupon.description}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                          {coupon.type === "PERCENTAGE"
                            ? `${coupon.value}% off`
                            : `${formatCurrency(coupon.value)} off`}
                          {coupon.maxDiscount !== null && (
                            <span className="block text-xs text-slate-500">
                              max {formatCurrency(coupon.maxDiscount)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                          {coupon.minimumOrder > 0
                            ? `Min ${formatCurrency(coupon.minimumOrder)}`
                            : "No minimum"}
                          {coupon.expiresAt && (
                            <span className="block text-slate-500">
                              Expires {formatDate(coupon.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                          {coupon.usedCount}
                          {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleActive(coupon)}
                              className="rounded-lg px-2 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              {coupon.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActive(coupon.active);
                                setType(coupon.type);
                                setErrors({});
                                setEditing(coupon);
                              }}
                              aria-label={`Edit ${coupon.code}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(coupon)}
                              aria-label={`Delete ${coupon.code}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {coupons.map((coupon) => {
                const status = statusOf(coupon);
                return (
                  <li key={coupon.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-medium text-slate-900">{coupon.code}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {coupon.type === "PERCENTAGE"
                            ? `${coupon.value}% off`
                            : `${formatCurrency(coupon.value)} off`}
                        </p>
                      </div>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Used {coupon.usedCount}
                      {coupon.usageLimit !== null && ` of ${coupon.usageLimit}`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActive(coupon.active);
                          setType(coupon.type);
                          setEditing(coupon);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleActive(coupon)}
                      >
                        {coupon.active ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleting(coupon)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeForm}
        title={editing ? `Edit ${editing.code}` : "New coupon"}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="coupon-form" loading={busy}>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={save} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="code" error={errors.code} required>
              <Input
                id="code"
                name="code"
                defaultValue={editing?.code ?? ""}
                required
                maxLength={24}
                placeholder="BIRYANI10"
                className="font-mono uppercase"
                error={errors.code}
              />
            </Field>
            <Field label="Discount type" htmlFor="type">
              <Select
                id="type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "PERCENTAGE" | "FIXED")
                }
              >
                <option value="PERCENTAGE">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
              </Select>
            </Field>
          </div>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <Input
              id="description"
              name="description"
              defaultValue={editing?.description ?? ""}
              maxLength={160}
              placeholder="10% off any order over Rs. 800"
              error={errors.description}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={type === "PERCENTAGE" ? "Percentage" : "Amount (Rs.)"}
              htmlFor="value"
              error={errors.value}
              required
            >
              <Input
                id="value"
                name="value"
                type="number"
                min={1}
                max={type === "PERCENTAGE" ? 100 : undefined}
                step="1"
                defaultValue={editing?.value ?? ""}
                required
                error={errors.value}
              />
            </Field>
            <Field
              label="Minimum order"
              htmlFor="minimumOrder"
              error={errors.minimumOrder}
            >
              <Input
                id="minimumOrder"
                name="minimumOrder"
                type="number"
                min={0}
                step="1"
                defaultValue={editing?.minimumOrder ?? 0}
                error={errors.minimumOrder}
              />
            </Field>
            <Field
              label="Max discount"
              htmlFor="maxDiscount"
              error={errors.maxDiscount}
              hint="Optional cap."
            >
              <Input
                id="maxDiscount"
                name="maxDiscount"
                type="number"
                min={0}
                step="1"
                defaultValue={editing?.maxDiscount ?? ""}
                error={errors.maxDiscount}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Expires on"
              htmlFor="expiresAt"
              error={errors.expiresAt}
              hint="Leave blank for no expiry."
            >
              <Input
                id="expiresAt"
                name="expiresAt"
                type="date"
                defaultValue={editing?.expiresAt ? editing.expiresAt.slice(0, 10) : ""}
                error={errors.expiresAt}
              />
            </Field>
            <Field
              label="Usage limit"
              htmlFor="usageLimit"
              error={errors.usageLimit}
              hint="Leave blank for unlimited."
            >
              <Input
                id="usageLimit"
                name="usageLimit"
                type="number"
                min={1}
                defaultValue={editing?.usageLimit ?? ""}
                error={errors.usageLimit}
              />
            </Field>
          </div>

          <Toggle
            label="Active"
            description="Disabled coupons are rejected at checkout."
            checked={active}
            onChange={setActive}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.code}?`}
        message="The code stops working immediately. Orders that already used it keep their discount — those totals are frozen."
        confirmLabel="Delete coupon"
      />
    </div>
  );
}
