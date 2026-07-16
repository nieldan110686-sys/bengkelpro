"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Printer, Receipt, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import ThermalInvoice from "@/components/shared/thermal-invoice";
import PrintButtons from "@/components/shared/print-buttons";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";

const STATUS_FLOW = ["NEW", "ESTIMATED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [wo, setWO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(false);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({
    type: "SERVICE", name: "", quantity: 1, unitPrice: 0, totalPrice: 0,
    inventoryId: "", mechanicId: "",
  });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintJobCard = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: A4; margin: 15mm; }`,
  });

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    // Parallelize all fetches
    Promise.all([fetchWO(), fetchMechanics(), fetchInventory()]);
  }, [id]);

  async function fetchWO() {
    try {
      const res = await fetch(`/api/work-orders/${id}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setWO(data); setNotes(data.notes || ""); setLoading(false);
    } catch { setLoading(false); }
  }

  async function fetchMechanics() {
    const res = await fetch("/api/mechanics");
    if (res.ok) setMechanics(Array.isArray((await res.json())) ? await res.json() : []);
  }

  async function fetchInventory() {
    const res = await fetch("/api/inventory?limit=500");
    if (res.ok) setInventory((await res.json()).inventory || []);
  }

  async function updateStatus(status: string) {
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    fetchWO();
    toast.success(`Status diubah ke ${getStatusLabel(status)}`);
  }

  async function assignMechanic(mechanicId: string) {
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mechanicId }),
    });
    fetchWO();
  }

  async function generateInvoice() {
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: id }),
    });
    if (!res.ok) { toast.error("Gagal membuat invoice"); return; }
    toast.success("Invoice dibuat!");
    fetchWO();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/work-orders/${id}/items`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemForm),
    });
    if (!res.ok) { toast.error("Gagal menambah item"); setSaving(false); return; }
    toast.success("Item ditambahkan");
    setItemModal(false); setSaving(false);
    setItemForm({ type: "SERVICE", name: "", quantity: 1, unitPrice: 0, totalPrice: 0, inventoryId: "", mechanicId: "" });
    fetchWO();
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Hapus item ini?")) return;
    await fetch(`/api/work-orders/${id}/items/${itemId}`, { method: "DELETE" });
    fetchWO();
    toast.success("Item dihapus");
  }

  function selectInventoryItem(invId: string) {
    const inv = inventory.find((i) => i.id === invId);
    if (inv) {
      setItemForm({
        ...itemForm, inventoryId: invId, name: inv.name,
        unitPrice: inv.sellPrice, quantity: 1,
        totalPrice: inv.sellPrice * 1,
      });
    }
  }

  function updateQty(qty: number) {
    setItemForm({ ...itemForm, quantity: qty, totalPrice: itemForm.unitPrice * qty });
  }

  function updateUnitPrice(price: number) {
    setItemForm({ ...itemForm, unitPrice: price, totalPrice: price * itemForm.quantity });
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Memuat...</div>;
  if (!wo) return <div className="text-center py-20 text-gray-500">Work Order tidak ditemukan.</div>;

  return (
    <div className="space-y-5">
      {/* Back + Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/work-orders")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{wo.orderNumber}</h1>
            <p className="text-sm text-gray-500">{formatDate(wo.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PrintButtons workOrderId={id} invoiceId={wo.invoice?.id} />
          {wo.customerPhone && (
            <Button variant="ghost" size="sm" onClick={() => {
              fetch("/api/notifications/whatsapp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "status_update", workOrderId: id }),
              }).then(r => r.json()).then(d => toast.success(d.method === "fallback" ? "WA dikirim (console)" : "WA terkirim!"));
            }}>
              <Send className="w-4 h-4" /> WA
            </Button>
          )}
          {!wo.invoice && wo.items?.length > 0 && (
            <Button size="sm" onClick={generateInvoice}>
              <Receipt className="w-4 h-4" /> Buat Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status Flow */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase">Status Work Order</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map((s) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      wo.status === s
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}>
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge>
                {wo.startedAt && <span className="text-xs text-gray-500">Mulai: {formatDateTime(wo.startedAt)}</span>}
                {wo.completedAt && <span className="text-xs text-gray-500">Selesai: {formatDateTime(wo.completedAt)}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle & Customer Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase">Informasi</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-gray-400">Kendaraan</p><p className="font-semibold">{wo.vehicle.brand} {wo.vehicle.model}</p></div>
              <div><p className="text-xs text-gray-400">No. Plat</p><p className="font-bold">{wo.vehicle.plateNumber}</p></div>
              <div><p className="text-xs text-gray-400">Pelanggan</p><p>{wo.customerName}</p></div>
              <div><p className="text-xs text-gray-400">No. HP</p><p>{wo.customerPhone || "-"}</p></div>
              <div><p className="text-xs text-gray-400">Mekanik</p>
                <select value={wo.mechanic?.id || ""} onChange={(e) => assignMechanic(e.target.value)}
                  className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5">
                  <option value="">Pilih Mekanik</option>
                  {mechanics.filter((m) => m.role === "MECHANIC").map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div><p className="text-xs text-gray-400">Dibuat Oleh</p><p>{wo.createdBy?.name || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase">Deskripsi</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">{wo.description}</p>
              <div className="mt-3">
                <label className="text-xs text-gray-400 block mb-1">Catatan Teknisi</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm"
                  rows={2} placeholder="Catatan internal..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase">Item Pekerjaan & Sparepart</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setItemModal(true)}>
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </Button>
            </CardHeader>
            <CardContent>
              {wo.items?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <th className="px-2 py-2 text-left">Item</th><th className="px-2 py-2 text-left">Tipe</th>
                      <th className="px-2 py-2 text-center">Qty</th><th className="px-2 py-2 text-right">Harga</th>
                      <th className="px-2 py-2 text-right">Total</th><th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wo.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="px-2 py-2.5">{item.name}</td>
                        <td className="px-2 py-2.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.type === "SERVICE" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                            {item.type === "SERVICE" ? "Jasa" : "Part"}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">{item.quantity}</td>
                        <td className="px-2 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-2 py-2.5 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                        <td className="px-2 py-2.5 text-right">
                          <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">Belum ada item. Tambahkan jasa atau sparepart.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Invoice & Payments */}
        <div className="space-y-5">
          {wo.invoice && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm">{wo.invoice.invoiceNumber}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>{formatCurrency(wo.invoice.subtotal)}</span></div>
                  {wo.invoice.discount > 0 && <div className="flex justify-between"><span className="text-gray-400">Diskon</span><span className="text-emerald-600">-{formatCurrency(wo.invoice.discount)}</span></div>}
                  <hr className="dark:border-gray-700" />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(wo.invoice.total)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Terbayar</span><span className="text-emerald-600 font-semibold">{formatCurrency(wo.invoice.paid)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Sisa</span>
                    <span className={wo.invoice.total - wo.invoice.paid > 0 ? "text-red-500 font-bold" : "text-emerald-600"}>
                      {formatCurrency(wo.invoice.total - wo.invoice.paid)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(wo.invoice.status)}>{getStatusLabel(wo.invoice.status)}</Badge>
                </CardContent>
              </Card>

              {/* Thermal print */}
              {wo.items?.length > 0 && (
                <ThermalInvoice data={{
                  invoiceNumber: wo.invoice.invoiceNumber,
                  orderNumber: wo.orderNumber,
                  customerName: wo.customerName,
                  vehicleInfo: `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plateNumber})`,
                  items: wo.items.map((it: any) => ({
                    name: it.name, type: it.type, quantity: it.quantity,
                    unitPrice: it.unitPrice, totalPrice: it.totalPrice,
                  })),
                  subtotal: wo.invoice.subtotal,
                  discount: wo.invoice.discount || 0,
                  total: wo.invoice.total,
                  paid: wo.invoice.paid,
                  status: wo.invoice.status,
                  payments: wo.payments || [],
                  mechanicName: wo.mechanic?.name || "-",
                  date: wo.createdAt,
                }} />
              )}
            </>
          )}
          {!wo.invoice && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-400">Invoice belum dibuat. Tambahkan item lalu klik "Buat Invoice".</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden Job Card for Print */}
      <div className="hidden">
        <div ref={printRef} style={{ padding: "10mm", fontFamily: "system-ui, sans-serif", fontSize: "11pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #000", paddingBottom: 8, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: "16pt", margin: 0, fontWeight: 900 }}>BENGKELPRO</h1>
              <p style={{ fontSize: "8pt", color: "#666", margin: "2px 0 0" }}>Job Card</p>
            </div>
            <div style={{ textAlign: "right", fontSize: "9pt" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>{wo.orderNumber}</p>
              <p style={{ margin: 0, color: "#666" }}>{formatDate(wo.createdAt)}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "8pt", color: "#999", margin: "0 0 2px" }}>PELANGGAN</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>{wo.customerName}</p>
              <p style={{ margin: 0, fontSize: "9pt" }}>{wo.customerPhone || "-"}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "8pt", color: "#999", margin: "0 0 2px" }}>KENDARAAN</p>
              <p style={{ margin: 0, fontWeight: "bold" }}>{wo.vehicle.brand} {wo.vehicle.model}</p>
              <p style={{ margin: 0, fontSize: "9pt" }}>{wo.vehicle.plateNumber} · {wo.vehicle.year}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "8pt", color: "#999", margin: "0 0 2px" }}>MEKANIK</p>
              <p style={{ margin: 0 }}>{wo.mechanic?.name || "Belum ditugaskan"}</p>
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 10, marginBottom: 12 }}>
            <p style={{ fontSize: "8pt", color: "#999", margin: "0 0 4px" }}>DESKRIPSI / KELUHAN</p>
            <p style={{ margin: 0 }}>{wo.description}</p>
          </div>

          {wo.items?.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px", fontSize: "8pt", borderBottom: "1px solid #ddd" }}>Item</th>
                  <th style={{ padding: "6px 8px", fontSize: "8pt", borderBottom: "1px solid #ddd" }}>Tipe</th>
                  <th style={{ padding: "6px 8px", fontSize: "8pt", borderBottom: "1px solid #ddd", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "6px 8px", fontSize: "8pt", borderBottom: "1px solid #ddd", textAlign: "right" }}>Harga</th>
                </tr>
              </thead>
              <tbody>
                {wo.items.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ padding: "6px 8px", fontSize: "9pt" }}>{item.name}</td>
                    <td style={{ padding: "6px 8px", fontSize: "9pt" }}>{item.type === "SERVICE" ? "Jasa" : "Part"}</td>
                    <td style={{ padding: "6px 8px", fontSize: "9pt", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "6px 8px", fontSize: "9pt", textAlign: "right" }}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {wo.notes && (
            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 10, marginBottom: 12 }}>
              <p style={{ fontSize: "8pt", color: "#999", margin: "0 0 4px" }}>CATATAN TEKNISI</p>
              <p style={{ margin: 0 }}>{wo.notes}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, borderTop: "1px solid #eee", paddingTop: 12, fontSize: "8pt", color: "#999" }}>
            <p style={{ margin: 0 }}>Tanda Tangan Pelanggan</p>
            <p style={{ margin: 0 }}>Tanda Tangan Mekanik</p>
            <p style={{ margin: 0 }}>Tanda Tangan Kasir</p>
          </div>
        </div>
      </div>

      {/* Item Modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title="Tambah Item" className="max-w-lg">
        <form onSubmit={addItem} className="space-y-3">
          <div className="flex gap-3">
            <button type="button" onClick={() => setItemForm({ ...itemForm, type: "SERVICE" })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${itemForm.type === "SERVICE" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
              Jasa
            </button>
            <button type="button" onClick={() => setItemForm({ ...itemForm, type: "PART" })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${itemForm.type === "PART" ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
              Sparepart
            </button>
          </div>

          {itemForm.type === "PART" && (
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Sparepart</label>
              <select value={itemForm.inventoryId} onChange={(e) => selectInventoryItem(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
                <option value="">Pilih dari stok</option>
                {inventory.filter((i) => i.stock > 0).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} (Stok: {i.stock})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Nama Item</label>
            <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Qty</label>
              <input type="number" min={1} value={itemForm.quantity} onChange={(e) => updateQty(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Harga Satuan</label>
              <input type="number" min={0} value={itemForm.unitPrice} onChange={(e) => updateUnitPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total</label>
              <input type="number" value={itemForm.totalPrice} disabled
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setItemModal(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Tambah"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
