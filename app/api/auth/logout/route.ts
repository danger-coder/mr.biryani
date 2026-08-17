import { destroySessionCookie } from "@/lib/auth/session";
import { ok, sameOrigin, csrfFailure } from "@/lib/api";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();
  await destroySessionCookie();
  return ok({ success: true });
}
