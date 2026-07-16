import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { itemId } = await params;

  try {
    await prisma.workOrderItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus item" }, { status: 500 });
  }
}
