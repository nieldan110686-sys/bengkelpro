import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";
import { workOrderItemSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  try {
    const body = await req.json();
    const validated = workOrderItemSchema.safeParse({ ...body, workOrderId: id });
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const item = await prisma.workOrderItem.create({ data: validated.data });

    // Jika sparepart, kurangi stok
    if (item.type === "PART" && item.inventoryId) {
      const inv = await prisma.inventory.findUnique({ where: { id: item.inventoryId } });
      if (inv) {
        await prisma.inventory.update({
          where: { id: item.inventoryId },
          data: { stock: { decrement: item.quantity } },
        });
        await prisma.inventoryLog.create({
          data: {
            inventoryId: item.inventoryId,
            type: "OUT",
            quantity: item.quantity,
            beforeStock: inv.stock,
            afterStock: inv.stock - item.quantity,
            reference: `WO-${id}`,
            userId: user.userId,
          },
        });
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah item" }, { status: 500 });
  }
}
