import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";
import * as XLSX from "xlsx";

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

  let rows: any[] = [];
  let sheetName = "Data";

  try {
    switch (type) {
      case "revenue": {
        sheetName = "Omzet";
        const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
        const payments = await prisma.payment.findMany({
          where,
          include: { workOrder: { select: { orderNumber: true, customerName: true } } },
          orderBy: { createdAt: "desc" },
        });
        rows = payments.map((p) => ({
          "No. WO": p.workOrder?.orderNumber || "-",
          "Pelanggan": p.workOrder?.customerName || "-",
          "Jumlah": p.amount,
          "Metode": p.method,
          "Referensi": p.reference || "-",
          "Tanggal": new Date(p.createdAt).toLocaleDateString("id-ID"),
        }));
        break;
      }

      case "services": {
        sheetName = "Servis";
        const where: any = {};
        if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
        const wos = await prisma.workOrder.findMany({
          where,
          include: {
            vehicle: { include: { customer: { select: { name: true } } } },
            mechanic: { select: { name: true } },
            items: true,
            invoice: true,
          },
          orderBy: { createdAt: "desc" },
        });
        rows = wos.map((wo) => ({
          "No. WO": wo.orderNumber,
          "Pelanggan": wo.customerName,
          "Kendaraan": `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plateNumber})`,
          "Status": wo.status,
          "Mekanik": wo.mechanic?.name || "-",
          "Jumlah Item": wo.items.length,
          "Total Invoice": wo.invoice?.total || 0,
          "Tanggal Masuk": new Date(wo.createdAt).toLocaleDateString("id-ID"),
        }));
        break;
      }

      case "inventory": {
        sheetName = "Stok";
        const logs = await prisma.inventoryLog.findMany({
          where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
          include: { inventory: { select: { name: true, code: true } }, user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        });
        rows = logs.map((l) => ({
          "Kode": l.inventory?.code || "-",
          "Barang": l.inventory?.name || "-",
          "Tipe": l.type === "IN" ? "Masuk" : "Keluar",
          "Qty": l.quantity,
          "Stok Sebelum": l.beforeStock,
          "Stok Sesudah": l.afterStock,
          "User": l.user?.name || "-",
          "Tanggal": new Date(l.createdAt).toLocaleDateString("id-ID"),
        }));
        break;
      }

      case "mechanics": {
        sheetName = "Mekanik";
        const where: any = { role: "MECHANIC", active: true };
        const mechanics = await prisma.user.findMany({
          where,
          include: { workOrders: { select: { id: true, orderNumber: true, completedAt: true } } },
        });
        rows = mechanics.map((m) => ({
          "Nama": m.name,
          "Email": m.email,
          "WO Selesai": m.workOrders.length,
          "Role": m.role,
        }));
        break;
      }

      case "work-orders": {
        sheetName = "Work Orders";
        const wos = await prisma.workOrder.findMany({
          include: {
            vehicle: { include: { customer: { select: { name: true } } } },
            mechanic: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        rows = wos.map((wo) => ({
          "No. WO": wo.orderNumber,
          "Pelanggan": wo.customerName,
          "No. HP": wo.customerPhone || "-",
          "Kendaraan": `${wo.vehicle.brand} ${wo.vehicle.model}`,
          "No. Polisi": wo.vehicle.plateNumber,
          "Status": wo.status,
          "Mekanik": wo.mechanic?.name || "-",
          "Deskripsi": wo.description,
          "Km": wo.mileage || "-",
          "Tanggal": new Date(wo.createdAt).toLocaleDateString("id-ID"),
        }));
        break;
      }
    }

    // Generate Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.slice(0, 100).map((r) => String(r[key] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=bengkelpro-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}
