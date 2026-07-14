import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: "Masukkan minimal 3 karakter" },
      { status: 400 }
    );
  }

  try {
    // 1. Try exact match by work order number
    const byWO = await prisma.workOrder.findFirst({
      where: { orderNumber: { contains: query, mode: "insensitive" } },
      include: {
        vehicle: {
          include: {
            customer: true,
            workOrders: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: { items: true, invoice: true, mechanic: { select: { name: true } } },
            },
          },
        },
        items: {
          include: {
            inventory: { select: { name: true, code: true } },
            mechanic: { select: { name: true } },
          },
        },
        mechanic: { select: { id: true, name: true } },
        invoice: true,
        payments: true,
      },
    });

    if (byWO) {
      return NextResponse.json({ results: [byWO], total: 1, source: "wo" });
    }

    // 2. Try by plate number
    const byPlate = await prisma.vehicle.findFirst({
      where: { plateNumber: { contains: query, mode: "insensitive" } },
      include: {
        customer: true,
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: {
              include: {
                inventory: { select: { name: true, code: true } },
                mechanic: { select: { name: true } },
              },
            },
            mechanic: { select: { id: true, name: true } },
            invoice: true,
            payments: true,
          },
        },
      },
    });

    if (byPlate) {
      const wos = byPlate.workOrders.map((wo) => ({
        ...wo,
        vehicle: byPlate,
      }));
      return NextResponse.json({ results: wos, total: wos.length, source: "plate", customer: byPlate.customer });
    }

    // 3. Try by customer phone
    const byPhone = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: { contains: query } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        vehicles: {
          include: {
            workOrders: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: {
                items: {
                  include: {
                    inventory: { select: { name: true, code: true } },
                    mechanic: { select: { name: true } },
                  },
                },
                mechanic: { select: { id: true, name: true } },
                invoice: true,
                payments: true,
              },
            },
          },
        },
      },
    });

    if (byPhone && byPhone.vehicles.length > 0) {
      const wos = byPhone.vehicles.flatMap((v) =>
        v.workOrders.map((wo) => ({
          ...wo,
          vehicle: {
            id: v.id,
            brand: v.brand,
            model: v.model,
            year: v.year,
            plateNumber: v.plateNumber,
            color: v.color,
            customer: byPhone,
          },
        }))
      );

      wos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return NextResponse.json({
        results: wos,
        total: wos.length,
        source: "phone",
        customer: byPhone,
      });
    }

    return NextResponse.json({ results: [], total: 0, source: "not_found" });
  } catch (error) {
    console.error("Tracking search error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
