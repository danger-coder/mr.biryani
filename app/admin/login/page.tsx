import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="brand-surface flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-saffron-400/12">
            <ShieldCheck className="h-5 w-5 text-saffron-400" aria-hidden />
          </div>
          <h1 className="display mt-5 text-3xl text-cream-100">Admin access</h1>
          <p className="mt-2 text-sm text-cream-100/50">
            Staff sign-in for the Mr. Biryani management panel.
          </p>
        </div>

        <Suspense fallback={<div className="skeleton h-56 rounded-lg" />}>
          <LoginForm admin />
        </Suspense>

        <p className="mt-8 text-center text-xs text-cream-100/35">
          Not staff?{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-cream-100/60">
            Back to the restaurant
          </Link>
        </p>
      </div>
    </div>
  );
}
