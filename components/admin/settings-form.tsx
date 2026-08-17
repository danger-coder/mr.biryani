"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Card, CardHeader } from "@/components/ui/primitives";

type Settings = Record<string, string>;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [ordering, setOrdering] = React.useState(settings.orderingEnabled === "true");
  const [reservations, setReservations] = React.useState(
    settings.reservationsEnabled === "true",
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload: Settings = {
      restaurantName: String(form.get("restaurantName") ?? ""),
      tagline: String(form.get("tagline") ?? ""),
      supportEmail: String(form.get("supportEmail") ?? ""),
      supportPhone: String(form.get("supportPhone") ?? ""),
      deliveryFee: String(form.get("deliveryFee") ?? ""),
      freeDeliveryOver: String(form.get("freeDeliveryOver") ?? ""),
      minimumOrder: String(form.get("minimumOrder") ?? ""),
      instagram: String(form.get("instagram") ?? ""),
      facebook: String(form.get("facebook") ?? ""),
      orderingEnabled: String(ordering),
      reservationsEnabled: String(reservations),
    };

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't save settings");
      return;
    }

    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <Card>
        <CardHeader
          title="Brand"
          description="Shown across the customer site."
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Restaurant name" htmlFor="restaurantName" error={errors.restaurantName}>
            <Input
              id="restaurantName"
              name="restaurantName"
              defaultValue={settings.restaurantName}
              error={errors.restaurantName}
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline" error={errors.tagline}>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={settings.tagline}
              error={errors.tagline}
            />
          </Field>
          <Field label="Support email" htmlFor="supportEmail" error={errors.supportEmail}>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              defaultValue={settings.supportEmail}
              error={errors.supportEmail}
            />
          </Field>
          <Field label="Support phone" htmlFor="supportPhone" error={errors.supportPhone}>
            <Input
              id="supportPhone"
              name="supportPhone"
              defaultValue={settings.supportPhone}
              error={errors.supportPhone}
            />
          </Field>
          <Field label="Instagram URL" htmlFor="instagram" error={errors.instagram}>
            <Input id="instagram" name="instagram" defaultValue={settings.instagram} />
          </Field>
          <Field label="Facebook URL" htmlFor="facebook" error={errors.facebook}>
            <Input id="facebook" name="facebook" defaultValue={settings.facebook} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Ordering"
          description="These figures drive every price calculation on the server."
        />
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field
            label="Delivery fee (Rs.)"
            htmlFor="deliveryFee"
            error={errors.deliveryFee}
          >
            <Input
              id="deliveryFee"
              name="deliveryFee"
              type="number"
              min={0}
              defaultValue={settings.deliveryFee}
              error={errors.deliveryFee}
            />
          </Field>
          <Field
            label="Free delivery over (Rs.)"
            htmlFor="freeDeliveryOver"
            error={errors.freeDeliveryOver}
          >
            <Input
              id="freeDeliveryOver"
              name="freeDeliveryOver"
              type="number"
              min={0}
              defaultValue={settings.freeDeliveryOver}
              error={errors.freeDeliveryOver}
            />
          </Field>
          <Field
            label="Minimum order (Rs.)"
            htmlFor="minimumOrder"
            error={errors.minimumOrder}
          >
            <Input
              id="minimumOrder"
              name="minimumOrder"
              type="number"
              min={0}
              defaultValue={settings.minimumOrder}
              error={errors.minimumOrder}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Availability"
          description="Switching these off closes the relevant flow for every customer immediately."
        />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Toggle
            label="Online ordering"
            description="When off, checkout is refused server-side."
            checked={ordering}
            onChange={setOrdering}
          />
          <Toggle
            label="Table reservations"
            description="When off, the booking form is replaced with a phone number."
            checked={reservations}
            onChange={setReservations}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
