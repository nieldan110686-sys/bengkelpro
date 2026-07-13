import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const secret = process.env.JWT_SECRET || "fallback-secret-change-me-in-production";
const JWT_SECRET = new TextEncoder().encode(secret);
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "bengkelpro-auth";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  branchId?: string | null;
}

function assertProductionSecret() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET === "fallback-secret-change-me-in-production")
  ) {
    console.error("⚠️  JWT_SECRET is not set in production!");
  }
}
assertProductionSecret();

export async function createToken(user: { id: string; name: string; email: string; role: string; branchId?: string | null }): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    branchId: user.branchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Server-side auth check for API routes and pages.
 * Works in both Node.js runtime (cookies()) and Edge runtime (NextRequest).
 */
export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  const token = req
    ? req.cookies.get(COOKIE_NAME)?.value
    : await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

export function authError(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}
