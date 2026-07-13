"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, Pagination } from "@/components/ui/table";
import toast from "react-hot-toast";

interface Vehicle { id: string; brand: string; model: string; year: number; plateNumber: string; vin?: string; customer: { name: string; phone: string }; }
interface Customer { id: string; name: string; phone: string; }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [q, setQ] = useState(""); const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ customerId: "", brand: "", model: "", year: new Date().getFullYear(), plateNumber: "", vin: "", color: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); fetchCustomers(); }, [page, q]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/vehicles?page=${page}&limit=15&q=${q}`);
    if (res.ok) { const d = await res.json(); setVehicles(d.vehicles); setTotal(d.total); }
    setLoading(false);
  }
  async function fetchCustomers() {
    const res = await fetch("/api/customers?limit=100");
    if (res.ok) setCustomers((await res.json()).customers);
  }

  function openCreate() { setEditId(null); setForm({ customerId: "", brand: "", model: "", year: new Date().getFullYear(), plateNumber: "", vin: "", color: "", notes: "" }); setModalOpen(true); }
  function openEdit(v: Vehicle) { setEditId(v.id); setForm({ customerId: "", brand: v.brand, model: v.model, year: v.year, plateNumber: v.plateNumber, vin: v.vin || "", color: "", notes: "" }); setModalOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const url = editId ? `/api/vehicles/${editId}` : "/api/vehicles";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Gagal"); setSaving(false); return; }
    toast.success(editId ? "Diperbarui" : "Ditambahkan");
    setModalOpen(false); setSaving(false); fetchData();
  }

  async function handleDelete(id: string) { if (!confirm("Hapus?")) return; await fetch(`/api/vehicles/${id}`, { method: "DELETE" }); toast.success("Dihapus"); fetchData(); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Kendaraan</h1><p className="text-gray-500 mt-1">Data kendaraan pelanggan</p></div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Tambah Kendaraan</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari no. polisi, merek, model..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </CardHeader>
        <CardContent>
          <Table loading={loading} data={vehicles} onRowClick={(v) => openEdit(v)}
            columns={[
              { key: "plateNumber", label: "No. Polisi", render: (v) => <span className="font-bold">{v.plateNumber}</span> },
              { key: "brand", label: "Merek/Model", render: (v) => `${v.brand} ${v.model} (${v.year})` },
              { key: "customer", label: "Pemilik", render: (v) => v.customer.name },
              { key: "actions", label: "", render: (v) => (
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(v.id)}>Hapus</Button>
                </div>
              )},
            ]}
          />
          <Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} />
        </CardContent>
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Kendaraan" : "Tambah Kendaraan"} className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Pelanggan</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="">Pilih Pelanggan</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Merek", field: "brand", required: true }, { label: "Model", field: "model", required: true },
              { label: "Tahun", field: "year", type: "number", required: true }, { label: "No. Polisi", field: "plateNumber", required: true },
              { label: "No. Rangka (VIN)", field: "vin" }, { label: "Warna", field: "color" },
            ].map(({ label, field, type, required }) => (
              <div key={field}><label className="block text-sm font-medium mb-1">{label}</label>
                <input type={type || "text"} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={required}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
