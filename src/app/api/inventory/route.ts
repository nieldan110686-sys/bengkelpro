import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/api-helpers";
import { inventorySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const lowStock = searchParams.get("lowStock");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  if (lowStock === "true") {
    where.stock = { lte: prisma.inventory.fields.minStock };
  }

  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.inventory.count({ where }),
  ]);

  return NextResponse.json({ inventory, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();
    const validated = inventorySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const item = await prisma.inventory.create({ data: validated.data });
    if (item.stock > 0) {
      await prisma.inventoryLog.create({
        data: {
          inventoryId: item.id,
          type: "IN",
          quantity: item.stock,
          beforeStock: 0,
          afterStock: item.stock,
          reference: "Initial stock",
          userId: user.userId,
        },
      });
    }
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Kode barang sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat item" }, { status: 500 });
  }
}
