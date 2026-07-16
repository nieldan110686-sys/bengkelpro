import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "3 solid #000",
    paddingBottom: 8,
    marginBottom: 16,
  },
  companyName: { fontSize: 18, fontWeight: "bold" },
  companySub: { fontSize: 8, color: "#666", marginTop: 2 },
  docTitle: { fontSize: 12, fontWeight: "bold", textAlign: "right" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 7, color: "#999", textTransform: "uppercase" },
  value: { fontSize: 10, fontWeight: "bold" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase", color: "#333", marginBottom: 6, borderBottom: "1 solid #ddd", paddingBottom: 3 },
  table: { marginBottom: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", padding: 6, borderBottom: "1 solid #ddd" },
  tableRow: { flexDirection: "row", padding: 5, borderBottom: "1 solid #f0f0f0" },
  colName: { flex: 4, fontSize: 9 },
  colType: { flex: 1, fontSize: 8 },
  colQty: { flex: 1, fontSize: 9, textAlign: "center" },
  colPrice: { flex: 2, fontSize: 9, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, borderTop: "2 solid #000", paddingTop: 6 },
  totalLabel: { fontSize: 11, fontWeight: "bold", marginRight: 20 },
  totalValue: { fontSize: 11, fontWeight: "bold" },
  footer: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 12, fontSize: 7, color: "#999" },
  noteBox: { border: "1 solid #ddd", borderRadius: 3, padding: 8, marginTop: 8 },
  statusBadge: {
    padding: "2 8",
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
  },
});

interface InvoicePDFProps {
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  vehicleInfo: string;
  items: Array<{
    name: string;
    type: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  status: string;
  payments: Array<{ method: string; amount: number; reference?: string | null }>;
  mechanicName: string;
  date: string;
  notes?: string | null;
}

function InvoicePDFDoc({ data }: { data: InvoicePDFProps }) {
  const statusMap: Record<string, string> = { UNPAID: "BELUM BAYAR", PARTIAL: "BAYAR SEBAGIAN", PAID: "LUNAS" };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>BENGKELPRO</Text>
            <Text style={styles.companySub}>Sistem Manajemen Bengkel Otomotif</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>INVOICE</Text>
            <Text style={{ fontSize: 8, textAlign: "right", color: "#666" }}>{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Pelanggan</Text>
              <Text style={styles.value}>{data.customerName}</Text>
            </View>
            <View>
              <Text style={styles.label}>No. WO</Text>
              <Text style={styles.value}>{data.orderNumber}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Kendaraan</Text>
              <Text style={{ fontSize: 9 }}>{data.vehicleInfo}</Text>
            </View>
            <View>
              <Text style={styles.label}>Tanggal</Text>
              <Text style={{ fontSize: 9 }}>{formatDate(data.date)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Mekanik</Text>
              <Text style={{ fontSize: 9 }}>{data.mechanicName}</Text>
            </View>
            <View>
              <Text style={styles.label}>Status</Text>
              <Text style={{ ...styles.statusBadge, backgroundColor: data.status === "PAID" ? "#dcfce7" : data.status === "PARTIAL" ? "#fef3c7" : "#fee2e2", color: data.status === "PAID" ? "#166534" : data.status === "PARTIAL" ? "#92400e" : "#991b1b" }}>
                {statusMap[data.status] || data.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Pekerjaan & Sparepart</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Item</Text>
            <Text style={styles.colType}>Tipe</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga</Text>
            <Text style={styles.colPrice}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={{ ...styles.colType, color: item.type === "SERVICE" ? "#2563eb" : "#7c3aed" }}>
                {item.type === "SERVICE" ? "Jasa" : "Part"}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ alignItems: "flex-end", marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 4, width: "50%" }}>
            <Text style={{ flex: 1, fontSize: 9, color: "#666" }}>Subtotal</Text>
            <Text style={{ fontSize: 9 }}>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.discount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 4, width: "50%" }}>
              <Text style={{ flex: 1, fontSize: 9, color: "#666" }}>Diskon</Text>
              <Text style={{ fontSize: 9, color: "#16a34a" }}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 4, width: "50%", borderTop: "2 solid #000", paddingTop: 4 }}>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: "bold" }}>TOTAL</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatCurrency(data.total)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "50%" }}>
            <Text style={{ flex: 1, fontSize: 8, color: "#999" }}>Terbayar</Text>
            <Text style={{ fontSize: 8, color: "#16a34a" }}>{formatCurrency(data.paid)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "50%" }}>
            <Text style={{ flex: 1, fontSize: 8, color: "#999" }}>Sisa</Text>
            <Text style={{ fontSize: 8, color: data.total - data.paid > 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
              {formatCurrency(data.total - data.paid)}
            </Text>
          </View>
        </View>

        {/* Payments */}
        {data.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>
            {data.payments.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 8 }}>{p.method} {p.reference ? `(${p.reference})` : ""}</Text>
                <Text style={{ fontSize: 8 }}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.noteBox}>
            <Text style={{ fontSize: 7, color: "#999", marginBottom: 2 }}>CATATAN</Text>
            <Text style={{ fontSize: 8 }}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Tanda Tangan Pelanggan</Text>
          <Text>Tanda Tangan Mekanik</Text>
          <Text>Tanda Tangan Kasir</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(data: InvoicePDFProps): Promise<ArrayBuffer> {
  const doc = <InvoicePDFDoc data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob.arrayBuffer();
}

export { InvoicePDFDoc };
