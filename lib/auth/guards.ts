import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
};

/**
 * Resolves the session against the database on every request. Going back to the
 * DB (rather than trusting the JWT body alone) means a deactivated account or a
 * demoted admin loses access immediately instead of at token expiry.
 * `cache` dedupes it within a single render pass.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session: SessionPayload | null = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
});

/** For pages: bounce to login, preserving where the user was headed. */
export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For admin pages. Customers are sent home — never to the admin login. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
