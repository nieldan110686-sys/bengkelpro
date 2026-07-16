import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";
import { generateInvoicePDF } from "@/components/pdf/invoice-pdf";
import { generateJobCardPDF } from "@/components/pdf/jobcard-pdf";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "invoice" | "jobcard"
  const id = searchParams.get("id");     // invoice ID or WO ID

  if (!type || !id) {
    return NextResponse.json({ error: "type and id required" }, { status: 400 });
  }

  try {
    if (type === "invoice") {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          workOrder: {
            include: {
              items: true,
              mechanic: { select: { name: true } },
              vehicle: true,
              payments: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      });

      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

      const pdf = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: invoice.workOrder.orderNumber,
        customerName: invoice.workOrder.customerName,
        customerPhone: invoice.workOrder.customerPhone || undefined,
        vehicleInfo: `${invoice.workOrder.vehicle.brand} ${invoice.workOrder.vehicle.model} (${invoice.workOrder.vehicle.plateNumber})`,
        items: invoice.workOrder.items.map((it) => ({
          name: it.name, type: it.type, quantity: it.quantity,
          unitPrice: it.unitPrice, totalPrice: it.totalPrice,
        })),
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        total: invoice.total,
        paid: invoice.paid,
        status: invoice.status,
        payments: invoice.workOrder.payments.map((p) => ({
          method: p.method, amount: p.amount, reference: p.reference,
        })),
        mechanicName: invoice.workOrder.mechanic?.name || "-",
        date: invoice.createdAt.toISOString(),
        notes: invoice.notes,
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        },
      });
    }

    if (type === "jobcard") {
      const wo = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          vehicle: true,
          mechanic: { select: { name: true } },
          items: true,
        },
      });

      if (!wo) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

      const pdf = await generateJobCardPDF({
        orderNumber: wo.orderNumber,
        customerName: wo.customerName,
        customerPhone: wo.customerPhone || undefined,
        vehicleBrand: wo.vehicle.brand,
        vehicleModel: wo.vehicle.model,
        plateNumber: wo.vehicle.plateNumber,
        year: wo.vehicle.year,
        description: wo.description,
        notes: wo.notes || undefined,
        mechanicName: wo.mechanic?.name || "Belum ditugaskan",
        status: wo.status,
        items: wo.items.map((it) => ({
          name: it.name, type: it.type, quantity: it.quantity, totalPrice: it.totalPrice,
        })),
        date: wo.createdAt.toISOString(),
        mileage: wo.mileage ?? undefined,
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="jobcard-${wo.orderNumber}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
  }
}
