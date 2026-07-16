import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 25, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "3 solid #000", paddingBottom: 8, marginBottom: 14 },
  companyName: { fontSize: 16, fontWeight: "bold" },
  companySub: { fontSize: 7, color: "#666", marginTop: 2 },
  jobCardTitle: {
    fontSize: 10, fontWeight: "bold", textAlign: "right",
    border: "1 solid #000", padding: "4 12",
  },
  row: { flexDirection: "row", marginBottom: 10, gap: 12 },
  infoBox: { flex: 1, border: "1 solid #ddd", borderRadius: 3, padding: 8 },
  infoLabel: { fontSize: 6, color: "#999", textTransform: "uppercase", fontWeight: "bold", marginBottom: 2 },
  infoValue: { fontSize: 9, fontWeight: "bold" },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", color: "#333", marginBottom: 5, borderBottom: "1 solid #ddd", paddingBottom: 2 },
  descBox: { border: "1 solid #ddd", borderRadius: 3, padding: 8, backgroundColor: "#fafafa" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 5, borderBottom: "1 solid #ddd", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "1 solid #f5f5f5" },
  colName: { flex: 4, fontSize: 8 },
  colType: { flex: 1.5, fontSize: 7, textAlign: "center" },
  colQty: { flex: 1, fontSize: 8, textAlign: "center" },
  colPrice: { flex: 2, fontSize: 8, textAlign: "right" },
  statusBox: {
    marginTop: 8, flexDirection: "row", justifyContent: "space-between",
    border: "1 solid #ddd", borderRadius: 3, padding: 8,
  },
  statusSteps: { flexDirection: "row", alignItems: "center", gap: 4 },
  step: { fontSize: 7, color: "#999" },
  stepActive: { fontSize: 7, color: "#16a34a", fontWeight: "bold" },
  stepArrow: { fontSize: 7, color: "#ddd", marginHorizontal: 2 },
  footer: { marginTop: "auto", flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 10, fontSize: 7, color: "#999" },
  mechanicNote: { border: "1 solid #ddd", borderRadius: 3, padding: 8, backgroundColor: "#fff8e1", marginTop: 8 },
});

interface JobCardPDFProps {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;
  year: number;
  description: string;
  notes?: string;
  mechanicName: string;
  status: string;
  items: Array<{ name: string; type: string; quantity: number; totalPrice: number }>;
  date: string;
  mileage?: number;
}

const STATUS_FLOW = ["NEW", "ESTIMATED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  NEW: "Baru", ESTIMATED: "Estimasi", IN_PROGRESS: "Proses",
  COMPLETED: "Selesai", DELIVERED: "Diambil", CANCELLED: "Dibatalkan",
};

function JobCardPDFDoc({ data }: { data: JobCardPDFProps }) {
  const currentIdx = STATUS_FLOW.indexOf(data.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>BENGKELPRO</Text>
            <Text style={styles.companySub}>Bengkel Otomotif Profesional</Text>
          </View>
          <View>
            <Text style={styles.jobCardTitle}>JOB CARD</Text>
            <Text style={{ fontSize: 8, textAlign: "right", marginTop: 2 }}>{data.orderNumber}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Pelanggan</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
            <Text style={{ fontSize: 7, color: "#888" }}>{data.customerPhone}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Kendaraan</Text>
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{data.vehicleBrand} {data.vehicleModel}</Text>
            <Text style={{ fontSize: 7, color: "#888" }}>{data.plateNumber} · {data.year}{data.mileage ? ` · ${data.mileage} km` : ""}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Mekanik</Text>
            <Text style={{ fontSize: 9 }}>{data.mechanicName || "Belum ditugaskan"}</Text>
            <Text style={{ fontSize: 7, color: "#888" }}>{formatDate(data.date)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi / Keluhan</Text>
          <View style={styles.descBox}>
            <Text style={{ fontSize: 8 }}>{data.description}</Text>
          </View>
        </View>

        {/* Items */}
        {data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pekerjaan & Sparepart</Text>
            <View style={{ border: "1 solid #ddd", borderRadius: 3 }}>
              <View style={styles.tableHeader}>
                <Text style={styles.colName}>Item</Text>
                <Text style={styles.colType}>Tipe</Text>
                <Text style={styles.colQty}>Qty</Text>
                <Text style={styles.colPrice}>Total</Text>
              </View>
              {data.items.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colName}>{item.name}</Text>
                  <Text style={{ ...styles.colType, color: item.type === "SERVICE" ? "#2563eb" : "#7c3aed" }}>
                    {item.type === "SERVICE" ? "Jasa" : "Part"}
                  </Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{formatCurrency(item.totalPrice)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Status Flow */}
        <View style={styles.statusBox}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusSteps}>
            {STATUS_FLOW.slice(0, 5).map((s, i) => (
              <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={i <= currentIdx ? styles.stepActive : styles.step}>
                  {i <= currentIdx ? "●" : "○"} {STATUS_LABELS[s]}
                </Text>
                {i < 4 && <Text style={styles.stepArrow}>→</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Mechanic Notes */}
        {data.notes && (
          <View style={styles.mechanicNote}>
            <Text style={{ fontSize: 6, color: "#b45309", fontWeight: "bold", textTransform: "uppercase", marginBottom: 2 }}>Catatan Teknisi</Text>
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

export async function generateJobCardPDF(data: JobCardPDFProps): Promise<ArrayBuffer> {
  const doc = <JobCardPDFDoc data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob.arrayBuffer();
}

export { JobCardPDFDoc };
