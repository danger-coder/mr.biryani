import { z } from "zod";
import { db } from "@/lib/db";
import {
  ok,
  fail,
  notFound,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

const schema = z.object({ active: z.boolean() });

/**
 * Activate or deactivate a customer account.
 *
 * Deactivating takes effect on the customer's very next request: `getCurrentUser`
 * re-reads `active` from the database on every render, so an existing session
 * stops working immediately rather than at token expiry.
 *
 * Only CUSTOMER rows can be targeted here — this endpoint must never become a
 * way to disable an administrator.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    const customer = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true },
    });
    if (!customer) return notFound("Customer");

    if (customer.role !== "CUSTOMER") {
      return fail("Only customer accounts can be deactivated here.", 403);
    }

    const updated = await db.user.update({
      where: { id },
      data: { active: parsed.data.active },
      // Never select passwordHash.
      select: { id: true, name: true, active: true },
    });

    return ok({ customer: updated });
  } catch (error) {
    return serverError(error);
  }
}
