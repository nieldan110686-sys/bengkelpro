import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  const item = await prisma.inventory.findUnique({
    where: { id },
    include: { logs: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true } } } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  const body = await req.json();
  const item = await prisma.inventory.update({ where: { id }, data: body });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;
  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
