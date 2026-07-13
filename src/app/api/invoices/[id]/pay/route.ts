import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return authError();
  const { id } = await params;

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const method = body.method || "CASH";

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice sudah lunas" }, { status: 400 });

    const newPaid = invoice.paid + amount;
    const status = newPaid >= invoice.total ? "PAID" : "PARTIAL";

    const payment = await prisma.payment.create({
      data: {
        workOrderId: invoice.workOrderId,
        amount,
        method,
        reference: body.reference,
        notes: body.notes,
      },
    });

    await prisma.invoice.update({
      where: { id },
      data: { paid: newPaid, status },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
  }
}
