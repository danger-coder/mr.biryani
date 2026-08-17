import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function AccountNotificationsPage() {
  const user = await requireUser("/account/notifications");

  const notifications = await db.notification.findMany({
    where: { userId: user.id, forAdmin: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <NotificationList notifications={notifications} />;
}
