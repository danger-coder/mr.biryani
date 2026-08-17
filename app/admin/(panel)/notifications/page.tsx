import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/primitives";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { forAdmin: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.notification.count({ where: { forAdmin: true, read: false } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {unread} unread · new orders, reservations and reviews land here.
        </p>
      </div>

      <Card className="p-4">
        <NotificationList
          tone="admin"
          notifications={notifications.map((notification) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: notification.read,
            createdAt: notification.createdAt.toISOString(),
          }))}
        />
      </Card>
    </div>
  );
}
