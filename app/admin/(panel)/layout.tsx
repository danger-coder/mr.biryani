import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already rejected non-admins at the edge; this re-checks the role
  // against the database so a stale token can never grant access.
  const user = await requireAdmin();

  const [pendingOrders, unreadNotifications] = await Promise.all([
    db.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } },
    }),
    db.notification.count({ where: { forAdmin: true, read: false } }),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      pendingOrders={pendingOrders}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </AdminShell>
  );
}
