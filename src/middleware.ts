import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth middleware DISABLED temporarily.
 * All routes are open for development convenience.
 * Re-enable by removing the early return below.
 */
export async function middleware(request: NextRequest) {
  // TEMP: Bypass all auth — semua terbuka
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
