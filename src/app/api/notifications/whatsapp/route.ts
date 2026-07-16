import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, authError } from "@/lib/auth";

/**
 * WhatsApp Notification API
 * 
 * Post notification events to this endpoint to trigger a WhatsApp message.
 * Supports Evolution API (self-hosted) or WhatsApp Cloud API.
 * 
 * Env vars:
 *   WHATSAPP_API_URL  - Evolution API base URL (e.g. http://localhost:8080)
 *   WHATSAPP_API_KEY  - Evolution API key
 *   WHATSAPP_INSTANCE - Instance name
 */

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return authError();

  try {
    const body = await req.json();
    const { type, workOrderId, phone } = body;

    if (!type || !workOrderId) {
      return NextResponse.json({ error: "type and workOrderId required" }, { status: 400 });
    }

    // Fetch WO data
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: true,
        invoice: true,
        mechanic: { select: { name: true } },
      },
    });

    if (!wo) return NextResponse.json({ error: "WO not found" }, { status: 404 });

    const targetPhone = phone || wo.customerPhone;
    if (!targetPhone) {
      return NextResponse.json({ error: "No phone number available" }, { status: 400 });
    }

    // Format phone: remove non-digit, add @c.us for WhatsApp Cloud API
    const cleanPhone = targetPhone.replace(/\D/g, "");

    // Build message
    let message = "";
    const statusLabels: Record<string, string> = {
      NEW: "Baru Masuk", ESTIMATED: "Estimasi", IN_PROGRESS: "Dalam Proses",
      COMPLETED: "Selesai", DELIVERED: "Diambil", CANCELLED: "Dibatalkan",
    };

    switch (type) {
      case "status_update":
        message = `🔧 *BengkelPro - Update Servis*\n\n` +
          `No. WO: *${wo.orderNumber}*\n` +
          `Kendaraan: ${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plateNumber})\n` +
          `Status: *${statusLabels[wo.status] || wo.status}*\n` +
          `${wo.mechanic ? `Mekanik: ${wo.mechanic.name}\n` : ""}` +
          `\nCek detail: ${process.env.NEXT_PUBLIC_APP_URL}/tracking?q=${wo.orderNumber}`;
        break;

      case "wo_created":
        message = `🛠️ *BengkelPro - Servis Baru*\n\n` +
          `Kendaraan Anda (${wo.vehicle.plateNumber}) telah terdaftar di bengkel kami.\n\n` +
          `No. WO: *${wo.orderNumber}*\n` +
          `Status: Menunggu Estimasi\n\n` +
          `Kami akan mengabari Anda jika ada update.\n` +
          `Cek status: ${process.env.NEXT_PUBLIC_APP_URL}/tracking`;
        break;

      case "invoice_ready":
        message = `🧾 *BengkelPro - Invoice*\n\n` +
          `No. WO: *${wo.orderNumber}*\n` +
          `Kendaraan: ${wo.vehicle.brand} ${wo.vehicle.model}\n\n` +
          `${wo.invoice ? `Total: *Rp ${wo.invoice.total.toLocaleString("id-ID")}*\n` : ""}` +
          `${wo.invoice ? `Status: ${wo.invoice.status === "PAID" ? "LUNAS ✅" : "Menunggu Pembayaran"}\n` : ""}` +
          `\nTerima kasih telah mempercayakan servis kendaraan Anda kepada BengkelPro.`;
        break;

      case "completed":
        message = `✅ *BengkelPro - Servis Selesai*\n\n` +
          `Kendaraan Anda *${wo.vehicle.plateNumber}* sudah selesai diservis! 🎉\n\n` +
          `No. WO: ${wo.orderNumber}\n` +
          `Silakan ambil kendaraan Anda di bengkel kami.\n\n` +
          `Jam operasional: 08:00 - 17:00 WIB\n\n` +
          `Terima kasih atas kepercayaan Anda!`;
        break;

      case "reminder":
        message = `⏰ *BengkelPro - Pengingat Servis*\n\n` +
          `Halo! Ini pengingat untuk servis kendaraan Anda.\n\n` +
          `Kendaraan: ${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plateNumber})\n\n` +
          `Silakan hubungi bengkel kami untuk booking.\n` +
          `📞 (021) 555-1234`;
        break;

      default:
        message = `🔔 *BengkelPro*\n\nUpdate untuk WO: ${wo.orderNumber}\nStatus: ${statusLabels[wo.status] || wo.status}`;
    }

    // Try Evolution API first
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;
    const instance = process.env.WHATSAPP_INSTANCE || "default";

    if (apiUrl && apiKey) {
      try {
        const waRes = await fetch(`${apiUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message,
          }),
        });

        if (waRes.ok) {
          return NextResponse.json({ success: true, method: "evolution_api", phone: cleanPhone });
        }

        const waError = await waRes.text();
        console.warn("WhatsApp API error:", waError);
        return NextResponse.json({
          success: false, method: "evolution_api", error: waError,
          message, phone: cleanPhone,
        }, { status: 502 });
      } catch (waErr) {
        console.warn("WhatsApp API unreachable:", waErr);
      }
    }

    // Fallback: return the message so frontend can display it
    console.log(`[WhatsApp Fallback] To: ${cleanPhone}\n${message}`);
    return NextResponse.json({
      success: true,
      method: "fallback",
      phone: cleanPhone,
      message,
      note: "WhatsApp API not configured — message logged to server console. Set WHATSAPP_API_URL to send via WhatsApp.",
    });

  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return NextResponse.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}
