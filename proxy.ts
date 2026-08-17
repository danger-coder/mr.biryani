import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge-level gate for /admin.
 *
 * This is the first line only — every admin page calls `requireAdmin()` and
 * every admin API calls `withAdmin()`, both of which re-check the role against
 * the database. Middleware runs on a token it cannot revoke, so it is treated as
 * a fast reject, never as the authority.
 */

const SESSION_COOKIE = "mb_session";

async function roleFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { issuer: "mr-biryani", audience: "mr-biryani" },
    );
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin login page must stay reachable to signed-out visitors.
  if (pathname === "/admin/login") {
    const role = await roleFromRequest(request);
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const role = await roleFromRequest(request);

    if (!role) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // A signed-in customer is sent to the storefront, not to the admin login —
    // there is nothing there for them and no hint that the route exists.
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Admin APIs additionally reject at the edge so unauthorised traffic never
  // reaches a route handler or the database.
  if (pathname.startsWith("/api/admin")) {
    const role = await roleFromRequest(request);
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have access to this resource." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
