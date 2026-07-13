import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";
import { customerSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { createdAt: "desc" } },
      bookings: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  try {
    const body = await req.json();
    const validated = customerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const customer = await prisma.customer.update({ where: { id }, data: validated.data });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update pelanggan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
