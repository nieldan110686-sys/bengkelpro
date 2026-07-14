"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency } from "@/lib/utils";
import ThermalInvoice from "@/components/shared/thermal-invoice";
import toast from "react-hot-toast";

interface Invoice {
  id: string; invoiceNumber: string; status: string; total: number; paid: number;
  subtotal: number; discount: number;
  workOrder: { orderNumber: string; customerName: string; status: string };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, method: "CASH", reference: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [page]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/invoices?page=${page}&limit=15`);
    if (res.ok) { const d = await res.json(); setInvoices(d.invoices); setTotal(d.total); }
    setLoading(false);
  }

  async function viewDetail(id: string) {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.ok) setSelectedInvoice(await res.json());
  }

  function openPayModal() {
    if (!selectedInvoice) return;
    setPayForm({ amount: selectedInvoice.total - selectedInvoice.paid, method: "CASH", reference: "", notes: "" });
    setPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payForm) });
    if (!res.ok) { toast.error("Gagal"); setSaving(false); return; }
    toast.success("Pembayaran berhasil");
    setPayModal(false); setSaving(false); viewDetail(selectedInvoice.id); fetchData();
  }

  // Build thermal invoice data
  const thermalData = selectedInvoice ? {
    invoiceNumber: selectedInvoice.invoiceNumber,
    orderNumber: selectedInvoice.workOrder?.orderNumber || "-",
    customerName: selectedInvoice.workOrder?.customerName || "-",
    vehicleInfo: selectedInvoice.workOrder?.vehicle
      ? `${selectedInvoice.workOrder.vehicle.brand} ${selectedInvoice.workOrder.vehicle.model} (${selectedInvoice.workOrder.vehicle.plateNumber})`
      : "-",
    items: selectedInvoice.workOrder?.items?.map((it: any) => ({
      name: it.name,
      type: it.type,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })) || [],
    subtotal: selectedInvoice.subtotal,
    discount: selectedInvoice.discount || 0,
    total: selectedInvoice.total,
    paid: selectedInvoice.paid,
    status: selectedInvoice.status,
    payments: selectedInvoice.workOrder?.payments || [],
    mechanicName: selectedInvoice.workOrder?.mechanic?.name || "-",
    date: selectedInvoice.createdAt || new Date(),
    notes: selectedInvoice.notes || null,
  } : null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Invoice</h1><p className="text-gray-500 mt-1">Kelola invoice & pembayaran</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table loading={loading} data={invoices}
              columns={[
                { key: "invoiceNumber", label: "No. Invoice", render: (i) => <span className="font-bold text-primary-600">{i.invoiceNumber}</span> },
                { key: "workOrder", label: "WO", render: (i) => i.workOrder?.orderNumber || "-" },
                { key: "workOrder.customerName", label: "Pelanggan", render: (i) => i.workOrder?.customerName || "-" },
                { key: "total", label: "Total", render: (i) => formatCurrency(i.total) },
                { key: "paid", label: "Terbayar", render: (i) => formatCurrency(i.paid) },
                { key: "status", label: "Status", render: (i) => <Badge className={getStatusColor(i.status)}>{getStatusLabel(i.status)}</Badge> },
                { key: "actions", label: "", render: (i) => <Button variant="ghost" size="sm" onClick={() => viewDetail(i.id)}>Detail</Button> },
              ]}
            />
            <div className="p-4"><Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} /></div>
          </CardContent>
        </Card>
        {selectedInvoice && (
          <Card>
            <CardHeader><h3 className="font-semibold">Detail Invoice</h3></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">No. Invoice</span><span className="font-bold">{selectedInvoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">WO</span><span>{selectedInvoice.workOrder?.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pelanggan</span><span>{selectedInvoice.workOrder?.customerName}</span></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Diskon</span><span>{formatCurrency(selectedInvoice.discount || 0)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(selectedInvoice.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Terbayar</span><span>{formatCurrency(selectedInvoice.paid)}</span></div>
              <div className="flex justify-between font-bold text-red-600"><span>Sisa</span><span>{formatCurrency(selectedInvoice.total - selectedInvoice.paid)}</span></div>
              <Badge className={getStatusColor(selectedInvoice.status)}>{getStatusLabel(selectedInvoice.status)}</Badge>
              {selectedInvoice.status !== "PAID" && <Button className="w-full mt-3" onClick={openPayModal}>Bayar</Button>}

              {/* Print button */}
              {thermalData && (
                <div className="mt-2">
                  <ThermalInvoice data={thermalData} />
                </div>
              )}

              {selectedInvoice.workOrder?.payments?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-xs uppercase text-gray-500 mb-2">Riwayat Pembayaran</h4>
                  {selectedInvoice.workOrder.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                      <span>{p.method} {p.reference ? `(${p.reference})` : ""}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Pembayaran Invoice">
        <form onSubmit={handlePay} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Jumlah</label>
            <input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} required min={1}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Metode</label>
            <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="CASH">Cash</option><option value="TRANSFER">Transfer</option><option value="QRIS">QRIS</option>
            </select></div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setPayModal(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Memproses..." : "Bayar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
