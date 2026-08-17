import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="display text-4xl text-cream-100">Forgot your password?</h1>
      <p className="mt-3 text-sm text-cream-100/55">
        Enter the email you signed up with and we&rsquo;ll send you a reset link.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
