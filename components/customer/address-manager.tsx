"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Star, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/primitives";

type Address = {
  id: string;
  label: string;
  address: string;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
};

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Address | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isDefault, setIsDefault] = React.useState(false);

  const open = creating || editing !== null;

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
      label: String(form.get("label") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      isDefault,
    };

    const response = await fetch("/api/addresses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't save that address");
      return;
    }

    toast.success(editing ? "Address updated" : "Address added");
    closeForm();
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch("/api/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleting.id }),
    });
    setBusy(false);
    setDeleting(null);

    if (!response.ok) {
      toast.error("Couldn't delete that address");
      return;
    }
    toast.success("Address deleted");
    router.refresh();
  }

  async function makeDefault(address: Address) {
    const response = await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: address.id, isDefault: true }),
    });
    if (!response.ok) {
      toast.error("Couldn't update your default address");
      return;
    }
    toast.success(`${address.label} is now your default`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setIsDefault(addresses.length === 0);
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-cream-100/10 bg-charcoal-900/40">
          <EmptyState
            tone="brand"
            icon={<MapPin className="h-6 w-6" />}
            title="No addresses saved."
            message="Save an address and checkout gets a lot faster next time."
          />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "rounded-2xl border p-5",
                address.isDefault
                  ? "border-saffron-400/35 bg-saffron-400/5"
                  : "border-cream-100/10 bg-charcoal-900/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-cream-100">
                    {address.label}
                    {address.isDefault && (
                      <span className="rounded-full bg-saffron-400/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-saffron-300">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cream-100/55">
                    {address.address}
                    <br />
                    {address.city}
                    {address.postalCode && ` ${address.postalCode}`}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-cream-100/10 pt-4 text-xs">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    className="inline-flex items-center gap-1.5 text-cream-100/55 transition-colors hover:text-saffron-300"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden />
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsDefault(address.isDefault);
                    setEditing(address);
                  }}
                  className="inline-flex items-center gap-1.5 text-cream-100/55 transition-colors hover:text-cream-100"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(address)}
                  className="inline-flex items-center gap-1.5 text-cream-100/55 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={closeForm}
        variant="brand"
        title={editing ? "Edit address" : "Add an address"}
        footer={
          <>
            <Button
              variant="outline"
              className="border-cream-100/25 text-cream-100"
              onClick={closeForm}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" form="address-form" loading={busy}>
              {editing ? "Save changes" : "Add address"}
            </Button>
          </>
        }
      >
        <form id="address-form" onSubmit={save} className="space-y-4" noValidate>
          <Field label="Label" htmlFor="label" error={errors.label} required>
            <Input
              id="label"
              name="label"
              defaultValue={editing?.label ?? "Home"}
              required
              maxLength={40}
              error={errors.label}
              className={inputTone}
            />
          </Field>
          <Field label="Street address" htmlFor="address" error={errors.address} required>
            <Input
              id="address"
              name="address"
              defaultValue={editing?.address ?? ""}
              required
              autoComplete="street-address"
              error={errors.address}
              className={inputTone}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="city" error={errors.city} required>
              <Input
                id="city"
                name="city"
                defaultValue={editing?.city ?? ""}
                required
                autoComplete="address-level2"
                error={errors.city}
                className={inputTone}
              />
            </Field>
            <Field label="Postal code" htmlFor="postalCode" error={errors.postalCode}>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={editing?.postalCode ?? ""}
                autoComplete="postal-code"
                error={errors.postalCode}
                className={inputTone}
              />
            </Field>
          </div>
          <Toggle
            label="Use as my default address"
            checked={isDefault}
            onChange={setIsDefault}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this address?"
        message={`"${deleting?.label}" will be removed from your account. Past orders keep the address they were delivered to.`}
        confirmLabel="Delete address"
      />
    </div>
  );
}
