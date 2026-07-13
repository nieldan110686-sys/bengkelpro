import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { workOrder: { select: { orderNumber: true, customerName: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();

    // Get WO items to calculate total
    const items = await prisma.workOrderItem.findMany({ where: { workOrderId: body.workOrderId } });
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const discount = body.discount || 0;
    const total = subtotal - discount;

    const invoice = await prisma.invoice.create({
      data: {
        workOrderId: body.workOrderId,
        invoiceNumber: generateOrderNumber("INV"),
        subtotal,
        discount,
        total,
        notes: body.notes,
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat invoice" }, { status: 500 });
  }
}
