"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Columns, List, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────
interface WorkOrder {
  id: string; orderNumber: string; customerName: string;
  vehicle: { plateNumber: string; brand: string; model: string; customer: { name: string } };
  mechanic?: { id: string; name: string } | null;
  status: string; description: string; createdAt: string;
}

const STATUS_COLUMNS = [
  { key: "NEW", label: "Baru Masuk", color: "border-blue-300 bg-blue-50 dark:bg-blue-950/30" },
  { key: "ESTIMATED", label: "Estimasi", color: "border-amber-300 bg-amber-50 dark:bg-amber-950/30" },
  { key: "IN_PROGRESS", label: "Dalam Proses", color: "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30" },
  { key: "COMPLETED", label: "Selesai", color: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "DELIVERED", label: "Diambil", color: "border-teal-300 bg-teal-50 dark:bg-teal-950/30" },
  { key: "CANCELLED", label: "Dibatalkan", color: "border-red-300 bg-red-50 dark:bg-red-950/30" },
];

// ─── Kanban Card ───────────────────────────────────
function KanbanCard({ wo, onClick }: { wo: WorkOrder; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold text-primary-600">{wo.orderNumber}</span>
        <Badge className={getStatusColor(wo.status) + " text-[10px]"}>{getStatusLabel(wo.status)}</Badge>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{wo.vehicle.customer.name}</p>
      <p className="text-xs text-gray-500 truncate mt-0.5">
        {wo.vehicle.brand} {wo.vehicle.model} · {wo.vehicle.plateNumber}
      </p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{wo.description}</span>
        <span className="text-[10px] text-gray-400">
          {new Date(wo.createdAt).toLocaleDateString("id-ID")}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState({ vehicleId: "", customerName: "", customerPhone: "", mechanicId: "", description: "", notes: "", mileage: "" });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchData(); fetchVehicles(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/work-orders?limit=100");
    if (res.ok) setWorkOrders((await res.json()).workOrders);
    setLoading(false);
  }

  async function fetchVehicles() {
    const res = await fetch("/api/vehicles?limit=100");
    if (res.ok) setVehicles((await res.json()).vehicles);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/work-orders", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (!res.ok) { toast.error("Gagal membuat WO"); setSaving(false); return; }
    toast.success("Work Order dibuat!");
    setModalOpen(false); setSaving(false);
    setForm({ vehicleId: "", customerName: "", customerPhone: "", mechanicId: "", description: "", notes: "", mileage: "" });
    fetchData();
  }

  function onVehicleSelect(vId: string) {
    const v = vehicles.find((v) => v.id === vId);
    if (v) setForm({ ...form, vehicleId: vId, customerName: v.customer?.name || "", customerPhone: v.customer?.phone || "" });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const woId = String(active.id);
    const newStatus = String(over.id);

    // Optimistic update
    setWorkOrders((prev) => prev.map((wo) => (wo.id === woId ? { ...wo, status: newStatus } : wo)));

    await fetch(`/api/work-orders/${woId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function handleExport() {
    const res = await fetch("/api/export?type=work-orders");
    if (!res.ok) return toast.error("Gagal export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "work-orders.xlsx";
    a.click(); URL.revokeObjectURL(url);
    toast.success("Berhasil export");
  }

  function goToDetail(id: string) {
    router.push(`/work-orders/${id}`);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Memuat...</div>;
  }

  // Group by status
  const columns = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: workOrders.filter((wo) => wo.status === col.key),
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Order</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola servis & antrian bengkel</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
            <button onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500"}`}>
              <Columns className="w-3.5 h-3.5 inline mr-1" /> Kanban
            </button>
            <button onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500"}`}>
              <List className="w-3.5 h-3.5 inline mr-1" /> Tabel
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4" /></Button>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> WO Baru</Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.key} id={col.key}
                className={`${col.color} rounded-xl p-3 min-h-[300px] border`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">{col.label}</h3>
                  <span className="text-[11px] font-semibold text-gray-500 bg-white/60 dark:bg-gray-800/60 rounded-full px-2 py-0.5">
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.items.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-6">Kosong</p>
                  ) : (
                    col.items.map((wo) => (
                      <KanbanCard key={wo.id} wo={wo} onClick={() => goToDetail(wo.id)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">No. WO</th>
                    <th className="px-4 py-3 text-left">Pelanggan</th>
                    <th className="px-4 py-3 text-left">Kendaraan</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Mekanik</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {workOrders.map((wo) => (
                    <tr key={wo.id} onClick={() => goToDetail(wo.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors text-sm">
                      <td className="px-4 py-3 font-bold text-primary-600">{wo.orderNumber}</td>
                      <td className="px-4 py-3">{wo.vehicle.customer.name}</td>
                      <td className="px-4 py-3 text-gray-500">{wo.vehicle.brand} {wo.vehicle.model} ({wo.vehicle.plateNumber})</td>
                      <td className="px-4 py-3"><Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge></td>
                      <td className="px-4 py-3">{wo.mechanic?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(wo.createdAt).toLocaleDateString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Work Order Baru" className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kendaraan</label>
            <select onChange={(e) => onVehicleSelect(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="">Pilih Kendaraan</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model} ({v.customer?.name})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nama Pelanggan", field: "customerName", required: true },
              { label: "No. HP", field: "customerPhone" },
            ].map(({ label, field, required }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required={required}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi / Keluhan</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              required rows={3}
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
