"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ThermalInvoiceProps {
  data: {
    invoiceNumber: string;
    orderNumber: string;
    customerName: string;
    vehicleInfo: string;
    items: Array<{
      name: string;
      type: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      description?: string | null;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    status: string;
    payments: Array<{
      method: string;
      amount: number;
      reference?: string | null;
    }>;
    mechanicName: string;
    date: string;
    notes?: string | null;
  };
}

const STATUS_MAP: Record<string, string> = {
  UNPAID: "BELUM BAYAR",
  PARTIAL: "BAYAR SEBAGIAN",
  PAID: "LUNAS",
};

export default function ThermalInvoice({ data }: ThermalInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: 80mm 297mm;
        margin: 2mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <>
      <button
        onClick={() => handlePrint()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        🖨️ Cetak Invoice
      </button>

      {/* Hidden print content */}
      <div className="hidden">
        <div
          ref={printRef}
          style={{
            width: "76mm",
            padding: "2mm",
            fontFamily: "monospace",
            fontSize: "10px",
            lineHeight: "1.4",
            color: "#000",
            backgroundColor: "#fff",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "4mm", borderBottom: "1px dashed #000", paddingBottom: "2mm" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>BENGKELPRO</h2>
            <p style={{ margin: "1mm 0", fontSize: "9px" }}>Sistem Manajemen Bengkel</p>
            <p style={{ margin: "1mm 0", fontSize: "9px" }}>────────────────────</p>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: "bold" }}>INVOICE</p>
          </div>

          {/* Info */}
          <div style={{ marginBottom: "3mm" }}>
            <table style={{ width: "100%", fontSize: "10px" }}>
              <tbody>
                {[
                  ["No. Invoice", data.invoiceNumber],
                  ["No. WO", data.orderNumber],
                  ["Tanggal", new Date(data.date).toLocaleDateString("id-ID")],
                  ["Pelanggan", data.customerName],
                  ["Kendaraan", data.vehicleInfo],
                  ["Mekanik", data.mechanicName],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ width: "30mm", paddingRight: "2mm" }}>{label}</td>
                    <td style={{ fontWeight: "bold" }}>: {value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: "2mm 0", fontSize: "9px" }}>────────────────────</p>

          {/* Items */}
          <table style={{ width: "100%", fontSize: "10px", marginBottom: "3mm" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ textAlign: "left", paddingBottom: "1mm" }}>Item</th>
                <th style={{ textAlign: "center", paddingBottom: "1mm" }}>Qty</th>
                <th style={{ textAlign: "right", paddingBottom: "1mm" }}>Harga</th>
                <th style={{ textAlign: "right", paddingBottom: "1mm" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px dotted #ccc" }}>
                  <td style={{ paddingTop: "1mm", fontSize: "9px" }}>
                    {item.name}
                    <br />
                    <span style={{ fontSize: "7px", color: "#666" }}>
                      {item.type === "SERVICE" ? "Jasa" : "Part"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", paddingTop: "1mm" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", paddingTop: "1mm", fontSize: "9px" }}>
                    {formatCurrency(item.unitPrice).replace("Rp", "")}
                  </td>
                  <td style={{ textAlign: "right", paddingTop: "1mm" }}>
                    {formatCurrency(item.totalPrice).replace("Rp", "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ margin: "2mm 0", fontSize: "9px" }}>────────────────────</p>

          {/* Totals */}
          <table style={{ width: "100%", fontSize: "10px", marginBottom: "2mm" }}>
            <tbody>
              {[
                ["Subtotal", formatCurrency(data.subtotal)],
                ["Diskon", formatCurrency(data.discount)],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td style={{ textAlign: "right" }}>{value}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", fontSize: "12px", borderTop: "2px solid #000", borderBottom: "2px solid #000" }}>
                <td style={{ paddingTop: "1mm" }}>TOTAL</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(data.total)}</td>
              </tr>
              {[
                ["Terbayar", formatCurrency(data.paid)],
                ["Sisa", formatCurrency(data.total - data.paid)],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td style={{ textAlign: "right" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ margin: "3mm 0", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
            STATUS: {STATUS_MAP[data.status] || data.status}
          </p>

          {/* Payments */}
          {data.payments.length > 0 && (
            <>
              <p style={{ margin: "2mm 0", fontSize: "9px" }}>────────────────────</p>
              <p style={{ fontWeight: "bold", fontSize: "9px", marginBottom: "1mm" }}>Pembayaran:</p>
              {data.payments.map((p, i) => (
                <p key={i} style={{ fontSize: "9px", margin: "1mm 0" }}>
                  {p.method} {p.reference ? `(${p.reference})` : ""} : {formatCurrency(p.amount)}
                </p>
              ))}
            </>
          )}

          {/* Notes */}
          {data.notes && (
            <>
              <p style={{ margin: "2mm 0", fontSize: "9px" }}>────────────────────</p>
              <p style={{ fontSize: "9px", margin: "1mm 0" }}>Catatan: {data.notes}</p>
            </>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "4mm", borderTop: "1px dashed #000", paddingTop: "2mm", fontSize: "9px" }}>
            <p style={{ margin: "0 0 1mm" }}>Terima kasih atas kepercayaan Anda</p>
            <p style={{ margin: 0 }}>════════════════════</p>
          </div>
        </div>
      </div>
    </>
  );
}
