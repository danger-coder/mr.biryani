import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { ok, fail, parseBody, serverError, sameOrigin, csrfFailure } from "@/lib/api";

// Compared against when no user matches, so a missing account and a wrong
// password take the same amount of time.
const DUMMY_HASH_PROMISE = hashPassword("timing-equalizer-not-a-real-password");

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  // Per-IP, so this has to tolerate a whole restaurant behind one NAT while
  // still making online brute force impractical.
  const limit = rateLimit(await clientKey("login"), 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return fail(
      `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      429,
    );
  }

  const parsed = await parseBody(request, loginSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        active: true,
      },
    });

    const valid = user
      ? await verifyPassword(password, user.passwordHash)
      : (await verifyPassword(password, await DUMMY_HASH_PROMISE), false);

    // One message for both cases — never confirm which half was wrong.
    if (!user || !valid) {
      return fail("That email and password combination isn't right.", 401);
    }

    if (!user.active) {
      return fail("This account has been deactivated. Please contact us.", 403);
    }

    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return serverError(error);
  }
}
