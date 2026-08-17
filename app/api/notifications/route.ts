import { z } from "zod";
import { db } from "@/lib/db";
import { unreadCountWhere } from "@/lib/notifications";
import {
  ok,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

/**
 * Notification inbox. Admins read the shared admin inbox; customers read only
 * their own rows. The scope is derived from the session role, never from a query
 * parameter.
 */
export async function GET(request: Request) {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

  const scope =
    auth.user.role === "ADMIN"
      ? { forAdmin: true }
      : { userId: auth.user.id, forAdmin: false };

  try {
    const [notifications, unread] = await Promise.all([
      db.notification.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({ where: unreadCountWhere(auth.user) }),
    ]);

    return ok({ notifications, unread });
  } catch (error) {
    return serverError(error);
  }
}

const markSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

/** Marks one notification (or all in scope) as read. */
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, markSchema);
  if (!parsed.ok) return parsed.response;

  const scope =
    auth.user.role === "ADMIN"
      ? { forAdmin: true }
      : { userId: auth.user.id, forAdmin: false };

  try {
    // The scope clause is always applied, so an id belonging to someone else
    // simply matches nothing.
    const result = await db.notification.updateMany({
      where: { ...scope, ...(parsed.data.all ? {} : { id: parsed.data.id ?? "" }) },
      data: { read: true },
    });

    const unread = await db.notification.count({ where: unreadCountWhere(auth.user) });
    return ok({ updated: result.count, unread });
  } catch (error) {
    return serverError(error);
  }
}
