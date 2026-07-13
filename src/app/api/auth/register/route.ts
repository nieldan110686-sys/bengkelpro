import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate input
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, email, password, confirmPassword } = validated.data;

    // 2. Check password match (double-check, zod already did)
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password tidak cocok" },
        { status: 400 }
      );
    }

    // 3. Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { email: ["Email sudah terdaftar"] } },
        { status: 409 }
      );
    }

    // 4. Hash password (12 rounds = safe default)
    const hashed = await bcrypt.hash(password, 12);

    // 5. Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "OWNER",
        active: true,
      },
    });

    // 6. Return success (no password leak)
    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 }
    );
  } catch (error) {
    // Log full error for debugging
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
