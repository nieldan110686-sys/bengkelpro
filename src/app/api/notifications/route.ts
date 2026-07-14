import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const notifications: Array<{
      id: string;
      type: string;
      message: string;
      link?: string;
      timestamp: number;
    }> = [];

    // Cek stok menipis
    const lowStock = await prisma.inventory.findMany({
      where: {
        stock: { lte: prisma.inventory.fields.minStock },
        active: true,
      },
      take: 5,
    });
    for (const item of lowStock) {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: "low_stock",
        message: `⚠️ Stok menipis: ${item.name} (${item.stock} ${item.unit})`,
        link: "/inventory",
        timestamp: Date.now(),
      });
    }

    // Cek WO baru (dalam 5 menit terakhir)
    const newWO = await prisma.workOrder.findMany({
      where: { createdAt: { gte: fiveMinAgo } },
      include: { vehicle: { select: { plateNumber: true } } },
      take: 5,
    });
    for (const wo of newWO) {
      notifications.push({
        id: `new-wo-${wo.id}`,
        type: "new_wo",
        message: `🔧 WO Baru: ${wo.orderNumber} - ${wo.vehicle.plateNumber}`,
        link: "/work-orders",
        timestamp: wo.createdAt.getTime(),
      });
    }

    // Cek WO selesai (dalam 5 menit terakhir)
    const completedWO = await prisma.workOrder.findMany({
      where: { completedAt: { gte: fiveMinAgo } },
      include: { vehicle: { select: { plateNumber: true } } },
      take: 5,
    });
    for (const wo of completedWO) {
      notifications.push({
        id: `done-wo-${wo.id}`,
        type: "wo_completed",
        message: `✅ Servis Selesai: ${wo.orderNumber} - ${wo.vehicle.plateNumber}`,
        link: "/work-orders",
        timestamp: wo.completedAt!.getTime(),
      });
    }

    notifications.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ notifications: notifications.slice(0, 10) });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ notifications: [] });
  }
}
