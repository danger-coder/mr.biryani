import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/customer/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/account");

  const unread = await db.notification.count({
    where: { userId: user.id, forAdmin: false, read: false },
  });

  return (
    <div className="pb-24 pt-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="eyebrow text-saffron-400">Your account</p>
          <h1 className="display mt-4 text-[clamp(2.25rem,6vw,3.75rem)] text-cream-100">
            {user.name}
          </h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <AccountNav unread={unread} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
