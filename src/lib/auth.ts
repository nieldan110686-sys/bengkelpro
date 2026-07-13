import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type User } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "bengkelpro-auth";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  branchId?: string | null;
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    branchId: user.branchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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
