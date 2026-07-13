import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations";

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
          { plateNumber: { contains: q } },
          { brand: { contains: q, mode: "insensitive" as const } },
          { model: { contains: q, mode: "insensitive" as const } },
          { vin: { contains: q } },
        ],
      }
    : {};

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return NextResponse.json({ vehicles, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();
    const validated = vehicleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({ data: validated.data });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Nomor polisi atau VIN sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat kendaraan" }, { status: 500 });
  }
}
