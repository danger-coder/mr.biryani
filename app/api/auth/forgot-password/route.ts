import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { ok, fail, parseBody, serverError, sameOrigin, csrfFailure } from "@/lib/api";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const limit = rateLimit(await clientKey("forgot"), 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("Too many reset requests. Please try again later.", 429);
  }

  const parsed = await parseBody(request, forgotPasswordSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, active: true },
    });

    // The response is identical whether or not the account exists — this
    // endpoint must not be usable to enumerate registered emails.
    const generic = {
      success: true,
      message:
        "If an account exists for that email, a reset link is on its way.",
    } as const;

    if (!user || !user.active) return ok(generic);

    const token = randomBytes(32).toString("hex");
    // Only the hash is stored; a database leak yields no usable reset links.
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${token}`;

    // No mail provider is configured in this environment. Rather than pretend an
    // email was sent, the link is logged for the developer and — in development
    // only — returned so the flow can actually be completed end to end.
    console.info(`[auth] Password reset link for ${parsed.data.email}: ${resetUrl}`);

    if (process.env.NODE_ENV !== "production") {
      return ok({ ...generic, devResetUrl: resetUrl });
    }

    return ok(generic);
  } catch (error) {
    return serverError(error);
  }
}
