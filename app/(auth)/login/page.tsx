import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/account");

  return (
    <div>
      <h1 className="display text-4xl text-cream-100">Welcome back.</h1>
      <p className="mt-3 text-sm text-cream-100/55">
        Sign in to track orders, save favourites and book a table.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-64 skeleton rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-cream-100/55">
        New here?{" "}
        <Link
          href="/register"
          className="text-saffron-300 underline underline-offset-4 hover:text-saffron-200"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
