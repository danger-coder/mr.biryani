import { db } from "@/lib/db";
import { profileSchema, changePasswordSchema } from "@/lib/validations/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function GET() {
  const auth = await withUser();
  if (!auth.ok) return auth.response;
  // Note the explicit select: passwordHash must never leave the server.
  return ok({ user: auth.user });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, profileSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await db.user.update({
      where: { id: auth.user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    // Keep the display name in the session token in step with the profile.
    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return ok({ user });
  } catch (error) {
    return serverError(error);
  }
}

/** Password change for a signed-in user (requires the current password). */
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, changePasswordSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const record = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { passwordHash: true },
    });
    if (!record) return fail("Account not found.", 404);

    const valid = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
    if (!valid) return fail("Your current password isn't right.", 400);

    await db.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
