import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "bengkelpro-auth";

/**
 * Paths that do NOT require authentication.
 * Everything else is protected.
 */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths (login, register, auth API)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If user is already logged in and visits login/register, redirect to dashboard
    const existingToken = request.cookies.get(COOKIE_NAME)?.value;
    if (
      existingToken &&
      (pathname === "/login" || pathname === "/register")
    ) {
      const payload = await verifyToken(existingToken);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Allow Next.js internal assets and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // 3. Allow the root path (redirects to /login or /dashboard elsewhere)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 4. Check auth token
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Verify token validity
  const payload = await verifyToken(token);
  if (!payload) {
    // Token invalid/expired → clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // 6. Token valid → pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
