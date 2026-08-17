import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/account");

  return (
    <div>
      <h1 className="display text-4xl text-cream-100">Join the table.</h1>
      <p className="mt-3 text-sm text-cream-100/55">
        Faster checkout, order history and Rs. 200 off your first order.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-cream-100/55">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-saffron-300 underline underline-offset-4 hover:text-saffron-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
