"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null };
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't save your profile");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="profile-name" error={errors.name}>
        <Input
          id="profile-name"
          name="name"
          defaultValue={user.name}
          autoComplete="name"
          required
          error={errors.name}
          className={inputTone}
        />
      </Field>

      <Field
        label="Email"
        htmlFor="profile-email"
        hint="Get in touch if you need to change your email."
      >
        <Input
          id="profile-email"
          defaultValue={user.email}
          disabled
          readOnly
          className={`${inputTone} opacity-60`}
        />
      </Field>

      <Field label="Phone" htmlFor="profile-phone" error={errors.phone}>
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          autoComplete="tel"
          placeholder="+977 98XXXXXXXX"
          error={errors.phone}
          className={inputTone}
        />
      </Field>

      <Button type="submit" loading={loading}>
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't change your password");
      return;
    }

    formElement.reset();
    toast.success("Password updated");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={errors.currentPassword}
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={errors.currentPassword}
          className={inputTone}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        error={errors.newPassword}
        hint="At least 8 characters."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          error={errors.newPassword}
          className={inputTone}
        />
      </Field>

      <Button type="submit" variant="outline" className="border-cream-100/25 text-cream-100" loading={loading}>
        Change password
      </Button>
    </form>
  );
}
