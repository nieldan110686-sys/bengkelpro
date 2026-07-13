import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";
import { workOrderSchema } from "@/lib/validations";
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
  if (searchParams.get("plate")) {
    where.vehicle = { plateNumber: { contains: searchParams.get("plate")! } };
  }

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        vehicle: { include: { customer: { select: { name: true, phone: true } } } },
        mechanic: { select: { id: true, name: true } },
        items: true,
        invoice: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return NextResponse.json({ workOrders, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();
    const validated = workOrderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const orderNumber = generateOrderNumber("WO");
    const workOrder = await prisma.workOrder.create({
      data: {
        ...validated.data,
        orderNumber,
        createdById: user.userId,
        branchId: user.branchId,
        status: "NEW",
      },
      include: {
        vehicle: { include: { customer: true } },
        mechanic: { select: { name: true } },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat work order" }, { status: 500 });
  }
}
