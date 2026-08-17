"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type ApiError = { error?: string; details?: Record<string, string> };

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiError &
    Record<string, unknown>;
  return { response, data };
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});

    const form = new FormData(event.currentTarget);
    const { response, data } = await post("/api/auth/login", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (!response.ok) {
      setError(data.error ?? "Sign in failed.");
      setFields(data.details ?? {});
      setLoading(false);
      return;
    }

    const user = data.user as { role: "ADMIN" | "CUSTOMER"; name: string };

    if (admin && user.role !== "ADMIN") {
      // Signed in fine, but this is not an admin — do not leave them on the
      // admin login screen thinking it failed silently.
      setError("This account doesn't have admin access.");
      setLoading(false);
      await fetch("/api/auth/logout", { method: "POST" });
      return;
    }

    toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
    const destination =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : user.role === "ADMIN"
          ? "/admin"
          : "/account";
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />

      <Field label="Email" htmlFor="email" error={fields.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          error={fields.email}
          className={inputTone}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={fields.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          error={fields.password}
          className={inputTone}
        />
      </Field>

      {!admin && (
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-cream-100/55 underline-offset-4 hover:text-saffron-300 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});

    const form = new FormData(event.currentTarget);
    const { response, data } = await post("/api/auth/register", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (!response.ok) {
      setError(data.error ?? "We couldn't create your account.");
      setFields(data.details ?? {});
      setLoading(false);
      return;
    }

    toast.success("Account created. Welcome to Mr. Biryani.");
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />

      <Field label="Full name" htmlFor="name" error={fields.name} required>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          placeholder="Rahul Sharma"
          error={fields.name}
          className={inputTone}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={fields.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          error={fields.email}
          className={inputTone}
        />
      </Field>

      <Field
        label="Phone"
        htmlFor="phone"
        error={fields.phone}
        hint="Optional — helps our rider reach you."
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+977 98XXXXXXXX"
          error={fields.phone}
          className={inputTone}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={fields.password}
        hint="At least 8 characters."
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          error={fields.password}
          className={inputTone}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState<string | null>(null);
  const [devUrl, setDevUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { response, data } = await post("/api/auth/forgot-password", {
      email: String(form.get("email") ?? ""),
    });

    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSent(String(data.message ?? "Check your inbox."));
    if (typeof data.devResetUrl === "string") setDevUrl(data.devResetUrl);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-cream-100/70">{sent}</p>
        {devUrl && (
          <div className="rounded-lg border border-saffron-400/25 bg-saffron-400/8 p-3.5">
            <p className="text-xs font-medium text-saffron-300">
              Development environment
            </p>
            <p className="mt-1 text-xs text-cream-100/60">
              No mail provider is configured, so no email was sent. Use this link
              to continue:
            </p>
            <Link
              href={devUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-2 block break-all text-xs text-saffron-300 underline underline-offset-4"
            >
              {devUrl}
            </Link>
          </div>
        )}
        <Link
          href="/login"
          className="inline-block text-sm text-cream-100/60 underline-offset-4 hover:text-saffron-300 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={inputTone}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Send reset link
      </Button>
      <Link
        href="/login"
        className="block text-center text-sm text-cream-100/55 underline-offset-4 hover:text-saffron-300 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password !== confirm) {
      setFields({ confirm: "Passwords don't match." });
      setLoading(false);
      return;
    }

    const { response, data } = await post("/api/auth/reset-password", {
      token,
      password,
    });

    if (!response.ok) {
      setError(data.error ?? "We couldn't reset your password.");
      setFields(data.details ?? {});
      setLoading(false);
      return;
    }

    toast.success("Password updated. You can sign in now.");
    router.push("/login");
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <FormError message="This reset link is missing its token." />
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-saffron-300 underline underline-offset-4"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field
        label="New password"
        htmlFor="password"
        error={fields.password}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputTone}
        />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={fields.confirm}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={inputTone}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Update password
      </Button>
    </form>
  );
}
