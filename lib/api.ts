import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/guards";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

export const unauthorized = () => fail("You must be signed in.", 401);
export const forbidden = () => fail("You do not have access to this resource.", 403);
export const notFound = (what = "Resource") => fail(`${what} not found.`, 404);

/**
 * Parses + validates a JSON body. Returns a discriminated result so callers
 * never touch unvalidated input.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: fail("Request body must be valid JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: fail("Please check the highlighted fields.", 422, fieldErrors(parsed.error)) };
  }
  return { ok: true, data: parsed.data };
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Guard for route handlers: any signed-in user. */
export async function withUser(): Promise<
  { ok: true; user: CurrentUser } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, user };
}

/** Guard for route handlers: admins only. Never leaks that the route exists. */
export async function withAdmin(): Promise<
  { ok: true; user: CurrentUser } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: unauthorized() };
  if (user.role !== "ADMIN") return { ok: false, response: forbidden() };
  return { ok: true, user };
}

/**
 * CSRF defence-in-depth.
 *
 * Session cookies are already `SameSite=Lax`, which blocks cross-site POSTs from
 * forms. This adds an explicit Origin check for every state-changing request so
 * a same-site-but-untrusted context still cannot act on the user's behalf.
 */
export function sameOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const origin = request.headers.get("origin");
  // Non-browser clients (curl, server-to-server) send no Origin at all.
  if (!origin) return true;

  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function csrfFailure() {
  return fail("Request origin could not be verified.", 403);
}

/** Uniform 500 handling so raw Prisma/DB errors never reach the client. */
export function serverError(error: unknown) {
  console.error("[api]", error);
  return fail("Something went wrong. Please try again.", 500);
}
