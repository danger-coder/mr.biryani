import "server-only";

import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type NotifyInput = {
  userId?: string | null;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  forAdmin?: boolean;
  tx?: Prisma.TransactionClient;
};

/**
 * Single entry point for notifications. Today it writes a row that the bell
 * polls; email/SMS/WhatsApp fan-out can be added here without touching callers.
 */
export async function notify({
  userId = null,
  type = "SYSTEM",
  title,
  message,
  link = null,
  forAdmin = false,
  tx,
}: NotifyInput) {
  const client = tx ?? db;
  return client.notification.create({
    data: { userId, type, title, message, link, forAdmin },
  });
}

export function unreadCountWhere(user: { id: string; role: string }) {
  return user.role === "ADMIN"
    ? { forAdmin: true, read: false }
    : { userId: user.id, forAdmin: false, read: false };
}
