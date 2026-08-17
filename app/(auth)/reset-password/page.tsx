import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div>
      <h1 className="display text-4xl text-cream-100">Choose a new password.</h1>
      <p className="mt-3 text-sm text-cream-100/55">
        Reset links expire an hour after they&rsquo;re requested and work once.
      </p>
      <div className="mt-8">
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </div>
  );
}
