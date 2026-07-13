import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";
import { customerSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { vehicles: true, bookings: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();
    const validated = customerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const customer = await prisma.customer.create({ data: validated.data });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat pelanggan" }, { status: 500 });
  }
}
