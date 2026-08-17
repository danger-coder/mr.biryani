"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

const TIMES = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

export function ReservationForm({
  user,
  locations,
}: {
  user: { name: string; email: string; phone: string | null } | null;
  locations: { id: string; name: string; city: string }[];
}) {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState<{ date: string; time: string; guests: number } | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 90);
  const maxDate = horizon.toISOString().slice(0, 10);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      guests: Number(form.get("guests") ?? 2),
      locationId: String(form.get("locationId") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "We couldn't book that table.");
      setErrors(data.details ?? {});
      return;
    }

    toast.success("Reservation requested");
    setDone({ date: payload.date, time: payload.time, guests: payload.guests });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-leaf-400/30 bg-leaf-500/8 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-leaf-400" aria-hidden />
        <h2 className="display mt-5 text-2xl text-cream-100">Table requested.</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream-100/60">
          We&rsquo;ve got your request for {done.guests}{" "}
          {done.guests === 1 ? "guest" : "guests"} on {done.date} at {done.time}. We
          will confirm by phone shortly — reservations are confirmed by our team,
          not automatically.
        </p>
        <Button
          variant="outline"
          className="mt-6 border-cream-100/25 text-cream-100"
          onClick={() => setDone(null)}
        >
          Book another table
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name} required>
          <Input
            id="name"
            name="name"
            defaultValue={user?.name ?? ""}
            autoComplete="name"
            required
            error={errors.name}
            className={inputTone}
          />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone} required>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user?.phone ?? ""}
            autoComplete="tel"
            required
            placeholder="+977 98XXXXXXXX"
            error={errors.phone}
            className={inputTone}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email ?? ""}
          autoComplete="email"
          error={errors.email}
          className={inputTone}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" htmlFor="date" error={errors.date} required>
          <Input
            id="date"
            name="date"
            type="date"
            min={today}
            max={maxDate}
            defaultValue={today}
            required
            error={errors.date}
            className={inputTone}
          />
        </Field>
        <Field label="Time" htmlFor="time" error={errors.time} required>
          <Select id="time" name="time" defaultValue="19:00" required className={inputTone}>
            {TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Guests" htmlFor="guests" error={errors.guests} required>
          <Select id="guests" name="guests" defaultValue="2" required className={inputTone}>
            {Array.from({ length: 20 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {locations.length > 0 && (
        <Field label="Restaurant" htmlFor="locationId">
          <Select id="locationId" name="locationId" className={inputTone}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name.replace("Mr. Biryani — ", "")} · {location.city}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field
        label="Anything we should know?"
        htmlFor="notes"
        hint="Birthdays, allergies, seating preferences."
      >
        <Textarea
          id="notes"
          name="notes"
          maxLength={400}
          placeholder="Window table if possible — it's a birthday."
          className={inputTone}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Request a table
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-cream-100/35">
        Requests are confirmed by our team, usually within the hour. For parties
        over 20, please call us.
      </p>
    </form>
  );
}
