import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const mechanics = await prisma.user.findMany({
    where: { role: { in: ["MECHANIC", "STAFF", "CASHIER", "ADMIN"] }, active: true },
    select: {
      id: true, name: true, email: true, phone: true, role: true, branchId: true,
      _count: { select: { workOrders: true } },
      commissionRates: { where: { active: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(mechanics);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const body = await req.json();
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });

  const hashed = await bcrypt.hash(body.password, 12);
  const mechanic = await prisma.user.create({
    data: { name: body.name, email: body.email, password: hashed, phone: body.phone, role: body.role, branchId: user.branchId },
  });

  return NextResponse.json(mechanic, { status: 201 });
}
