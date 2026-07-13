import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const [
    todayRevenue, weekRevenue, monthRevenue, yearRevenue,
    todayWorkOrders, totalWorkOrders, inProgress,
    totalCustomers, totalVehicles,
    lowStockItems, pendingBookings,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: today, lt: todayEnd } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: weekStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: yearStart } } }),
    prisma.workOrder.count({ where: { createdAt: { gte: today } } }),
    prisma.workOrder.count(),
    prisma.workOrder.count({ where: { status: "IN_PROGRESS" } }),
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.inventory.count({ where: { stock: { lte: prisma.inventory.fields.minStock } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    revenue: {
      today: todayRevenue._sum.amount || 0,
      week: weekRevenue._sum.amount || 0,
      month: monthRevenue._sum.amount || 0,
      year: yearRevenue._sum.amount || 0,
    },
    workOrders: { today: todayWorkOrders, total: totalWorkOrders, inProgress },
    customers: totalCustomers,
    vehicles: totalVehicles,
    alerts: { lowStock: lowStockItems, pendingBookings },
  });
}
