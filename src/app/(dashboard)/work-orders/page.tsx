"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import toast from "react-hot-toast";

interface WorkOrder {
  id: string; orderNumber: string; customerName: string; customerPhone?: string;
  vehicle: { plateNumber: string; brand: string; model: string; customer: { name: string; phone: string } };
  mechanic?: { id: string; name: string } | null;
  status: string; description: string; createdAt: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [form, setForm] = useState({ vehicleId: "", customerName: "", customerPhone: "", mechanicId: "", description: "", notes: "", mileage: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); fetchVehicles(); fetchMechanics(); }, [page]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/work-orders?page=${page}&limit=15`);
    if (res.ok) { const d = await res.json(); setWorkOrders(d.workOrders); setTotal(d.total); }
    setLoading(false);
  }
  async function fetchVehicles() { const res = await fetch("/api/vehicles?limit=100"); if (res.ok) setVehicles((await res.json()).vehicles); }
  async function fetchMechanics() { const res = await fetch("/api/mechanics"); if (res.ok) setMechanics(await res.json()); }

  function openCreate() { setForm({ vehicleId: "", customerName: "", customerPhone: "", mechanicId: "", description: "", notes: "", mileage: "" }); setModalOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Gagal membuat WO"); setSaving(false); return; }
    toast.success("Work Order dibuat!");
    setModalOpen(false); setSaving(false); fetchData();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/work-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  }

  function onVehicleSelect(vId: string) {
    const v = vehicles.find((v) => v.id === vId);
    if (v) setForm({ ...form, vehicleId: vId, customerName: v.customer?.name || "", customerPhone: v.customer?.phone || "" });
  }

  const statusFlow = ["NEW", "ESTIMATED", "IN_PROGRESS", "COMPLETED", "DELIVERED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Work Order</h1><p className="text-gray-500 mt-1">Kelola servis & antrian bengkel</p></div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Work Order Baru</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={workOrders}
            columns={[
              { key: "orderNumber", label: "No. WO", render: (wo) => <span className="font-bold text-primary-600">{wo.orderNumber}</span> },
              { key: "customer", label: "Pelanggan", render: (wo) => wo.vehicle?.customer?.name || wo.customerName },
              { key: "vehicle", label: "Kendaraan", render: (wo) => `${wo.vehicle?.brand || ""} ${wo.vehicle?.model || ""} (${wo.vehicle?.plateNumber || ""})` },
              { key: "status", label: "Status", render: (wo) => <Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge> },
              { key: "mechanic", label: "Mekanik", render: (wo) => wo.mechanic?.name || "-" },
              { key: "actions", label: "", render: (wo) => (
                <div className="flex gap-1 justify-end">
                  {statusFlow.map((s) => (
                    <button key={s} onClick={() => updateStatus(wo.id, s)}
                      className={`px-2 py-1 text-xs rounded ${wo.status === s ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {getStatusLabel(s).slice(0, 3)}
                    </button>
                  ))}
                </div>
              )},
            ]}
          />
          <div className="p-4"><Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} /></div>
        </CardContent>
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Work Order Baru" className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Kendaraan</label>
            <select onChange={(e) => onVehicleSelect(e.target.value)} required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="">Pilih Kendaraan</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model} ({v.customer?.name})</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Nama Pelanggan", field: "customerName", required: true }, { label: "No. HP", field: "customerPhone" }].map(({ label, field, required }) => (
              <div key={field}><label className="block text-sm font-medium mb-1">{label}</label>
                <input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={required}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi / Keluhan</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Buat WO"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
