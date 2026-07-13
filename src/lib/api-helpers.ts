import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookie, type JWTPayload } from "@/lib/auth";

export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  const token = req
    ? req.cookies.get(process.env.AUTH_COOKIE_NAME || "bengkelpro-auth")?.value
    : await getAuthCookie();

  if (!token) return null;
  return verifyToken(token);
}

export function authError(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}
