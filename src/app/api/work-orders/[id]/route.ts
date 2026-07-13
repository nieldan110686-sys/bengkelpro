import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: { select: { name: true, phone: true } } } },
      mechanic: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      items: { include: { inventory: true, mechanic: { select: { name: true } } } },
      invoice: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wo);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  const body = await req.json();
  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.mechanicId !== undefined) updateData.mechanicId = body.mechanicId;
  if (body.description) updateData.description = body.description;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.mileage !== undefined) updateData.mileage = body.mileage;
  if (body.status === "IN_PROGRESS" && !updateData.startedAt) updateData.startedAt = new Date();
  if (body.status === "COMPLETED") updateData.completedAt = new Date();

  const wo = await prisma.workOrder.update({ where: { id }, data: updateData });
  return NextResponse.json(wo);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;
  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
