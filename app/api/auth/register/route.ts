import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, clientKey } from "@/lib/auth/rate-limit";
import { ok, fail, parseBody, serverError, sameOrigin, csrfFailure } from "@/lib/api";
import { notify } from "@/lib/notifications";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const limit = rateLimit(await clientKey("register"), 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return fail("Too many sign-up attempts. Please try again later.", 429);
  }

  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, phone, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      // Deliberately specific: an attacker can already discover this by trying
      // to register, and vagueness here only frustrates real users.
      return fail("An account with this email already exists.", 409);
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        // Role is never taken from the request body. New accounts are customers.
        role: "CUSTOMER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await notify({
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to Mr. Biryani",
      message:
        "Your account is ready. Your first order over Rs. 1,000 gets Rs. 200 off with WELCOME200.",
      link: "/menu",
    });

    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return ok({ user }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
