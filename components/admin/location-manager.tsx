"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";

export type AdminLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string | null;
  openingHours: string;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  active: boolean;
  linkedRecords: number;
};

export function LocationManager({ locations }: { locations: AdminLocation[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminLocation | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AdminLocation | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [active, setActive] = React.useState(true);

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
      name: String(form.get("name") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      openingHours: String(form.get("openingHours") ?? ""),
      latitude: String(form.get("latitude") ?? ""),
      longitude: String(form.get("longitude") ?? ""),
      image: String(form.get("image") ?? ""),
      active,
    };

    const response = await fetch(
      editing ? `/api/admin/locations/${editing.id}` : "/api/admin/locations",
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
      toast.error(data.error ?? "Couldn't save this location");
      return;
    }

    toast.success(editing ? "Location updated" : "Location created");
    closeForm();
    router.refresh();
  }

  async function toggleActive(location: AdminLocation) {
    const response = await fetch(`/api/admin/locations/${location.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !location.active }),
    });
    if (!response.ok) {
      toast.error("Couldn't update this location");
      return;
    }
    toast.success(location.active ? "Location deactivated" : "Location activated");
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/locations/${deleting.id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setDeleting(null);

    if (!response.ok) {
      toast.error(data.error ?? "Couldn't delete this location");
      return;
    }
    toast.success(data.message ?? "Location deleted");
    router.refresh();
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Locations</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Active locations appear on the customer site automatically.
          </p>
        </div>
        <Button
          onClick={() => {
            setActive(true);
            setErrors({});
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No locations yet."
            message="Add your first restaurant so customers can find you."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {locations.map((location) => (
            <Card key={location.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-slate-900">{location.name}</h2>
                    <Badge tone={location.active ? "green" : "slate"}>
                      {location.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {location.address}, {location.city}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{location.openingHours}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {location.phone}
                    {location.email && ` · ${location.email}`}
                  </p>
                  {location.latitude !== null && location.longitude !== null && (
                    <p className="mt-1 text-xs text-slate-400">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setActive(location.active);
                    setErrors({});
                    setEditing(location);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleActive(location)}>
                  {location.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="ml-auto"
                  onClick={() => setDeleting(location)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeForm}
        size="lg"
        title={editing ? `Edit ${editing.name}` : "New location"}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="location-form" loading={busy}>
              {editing ? "Save changes" : "Create location"}
            </Button>
          </>
        }
      >
        <form id="location-form" onSubmit={save} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={editing?.name ?? ""}
              required
              maxLength={80}
              placeholder="Mr. Biryani — Durbar Marg"
              error={errors.name}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Address" htmlFor="address" error={errors.address} required>
              <Input
                id="address"
                name="address"
                defaultValue={editing?.address ?? ""}
                required
                error={errors.address}
              />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city} required>
              <Input
                id="city"
                name="city"
                defaultValue={editing?.city ?? ""}
                required
                error={errors.city}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone" error={errors.phone} required>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={editing?.phone ?? ""}
                required
                error={errors.phone}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
                error={errors.email}
              />
            </Field>
          </div>

          <Field
            label="Opening hours"
            htmlFor="openingHours"
            error={errors.openingHours}
            required
          >
            <Input
              id="openingHours"
              name="openingHours"
              defaultValue={editing?.openingHours ?? ""}
              required
              placeholder="Mon–Sun · 11:00 – 23:00"
              error={errors.openingHours}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Latitude"
              htmlFor="latitude"
              error={errors.latitude}
              hint="Optional — enables the map link."
            >
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={editing?.latitude ?? ""}
                error={errors.latitude}
              />
            </Field>
            <Field label="Longitude" htmlFor="longitude" error={errors.longitude}>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={editing?.longitude ?? ""}
                error={errors.longitude}
              />
            </Field>
          </div>

          <Field
            label="Image path"
            htmlFor="image"
            error={errors.image}
            hint="Defaults to /images/locations/<slug>.webp"
          >
            <Input
              id="image"
              name="image"
              defaultValue={editing?.image ?? ""}
              error={errors.image}
            />
          </Field>

          <Toggle
            label="Active"
            description="Inactive locations are hidden from the customer site and reservation form."
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
        title={`Delete ${deleting?.name}?`}
        message={
          deleting && deleting.linkedRecords > 0
            ? `This location is linked to ${deleting.linkedRecords} orders and reservations, so it will be deactivated instead of deleted — that keeps reporting intact.`
            : "This location will be permanently removed."
        }
        confirmLabel={
          deleting && deleting.linkedRecords > 0 ? "Deactivate" : "Delete location"
        }
      />
    </div>
  );
}
