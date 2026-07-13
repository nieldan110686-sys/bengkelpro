import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "revenue";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  let data: any = {};

  switch (type) {
    case "revenue": {
      const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
      const payments = await prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, include: { workOrder: { select: { orderNumber: true, customerName: true } } } });
      data = payments;
      break;
    }
    case "services": {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
      const wo = await prisma.workOrder.findMany({
        where,
        include: {
          vehicle: { include: { customer: { select: { name: true } } } },
          mechanic: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      });
      data = wo;
      break;
    }
    case "inventory": {
      const logs = await prisma.inventoryLog.findMany({
        where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
        include: { inventory: { select: { name: true, code: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      data = logs;
      break;
    }
    case "mechanics": {
      const mechanics = await prisma.user.findMany({
        where: { role: "MECHANIC", active: true },
        include: {
          workOrders: {
            where: Object.keys(dateFilter).length ? { completedAt: dateFilter } : { NOT: { completedAt: null } },
            select: { id: true, orderNumber: true, completedAt: true },
          },
        },
      });
      data = mechanics.map((m) => ({
        ...m,
        completedCount: m.workOrders.length,
      }));
      break;
    }
  }

  return NextResponse.json(data);
}
