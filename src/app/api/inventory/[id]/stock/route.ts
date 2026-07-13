import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  try {
    const body = await req.json();
    const { type, quantity, notes } = body;

    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const qty = Math.abs(Number(quantity));
    if (type === "OUT" && item.stock < qty) {
      return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
    }

    const newStock = type === "IN" ? item.stock + qty : item.stock - qty;

    await prisma.inventory.update({
      where: { id },
      data: { stock: newStock },
    });

    await prisma.inventoryLog.create({
      data: {
        inventoryId: id,
        type: type === "IN" ? "IN" : "OUT",
        quantity: qty,
        beforeStock: item.stock,
        afterStock: newStock,
        reference: body.reference,
        notes,
        userId: user.userId,
      },
    });

    return NextResponse.json({ message: "Stok berhasil diperbarui", stock: newStock });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update stok" }, { status: 500 });
  }
}
