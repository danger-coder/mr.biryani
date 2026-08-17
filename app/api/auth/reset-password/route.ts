import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { ok, fail, parseBody, serverError, sameOrigin, csrfFailure } from "@/lib/api";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const limit = rateLimit(await clientKey("reset"), 10, 60 * 60 * 1000);
  if (!limit.allowed) return fail("Too many attempts. Please try again later.", 429);

  const parsed = await parseBody(request, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");

  try {
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return fail("This reset link is invalid or has expired.", 400);
    }

    // Consume the token and set the password together — a link works once.
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(parsed.data.password) },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
