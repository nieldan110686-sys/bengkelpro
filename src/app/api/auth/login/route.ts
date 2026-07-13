import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { createToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    const body = await req.json();

    // 2. Validate input
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, password } = validated.data;

    // 3. Find user by email (email is @unique in schema)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        branchId: true,
        active: true,
      },
    });

    // 4. User not found OR inactive → same error message (security best practice)
    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // 5. Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // 6. Create JWT token
    const token = await createToken(user);

    // 7. Set HTTP-only cookie
    await setAuthCookie(token);

    // 8. Return user data (NEVER include password)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
