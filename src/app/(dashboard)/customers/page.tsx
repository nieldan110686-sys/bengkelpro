"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, Pagination } from "@/components/ui/table";
import toast from "react-hot-toast";

interface Customer {
  id: string; name: string; phone: string; email?: string; address?: string;
  _count: { vehicles: number; bookings: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [page, q]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/customers?page=${page}&limit=15&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(data.customers);
    setTotal(data.total);
    setLoading(false);
  }

  function openCreate() { setEditId(null); setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setModalOpen(true); }
  function openEdit(c: Customer) { setEditId(c.id); setForm({ name: c.name, phone: c.phone, email: c.email || "", address: c.address || "", notes: "" }); setModalOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const url = editId ? `/api/customers/${editId}` : "/api/customers";
    const method = editId ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Gagal"); return; }
      toast.success(editId ? "Pelanggan diperbarui" : "Pelanggan ditambahkan");
      setModalOpen(false); fetchData();
    } catch { toast.error("Gagal"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pelanggan ini?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    toast.success("Dihapus"); fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Pelanggan</h1><p className="text-gray-500 mt-1">Kelola data pelanggan bengkel</p></div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Tambah Pelanggan</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari nama atau nomor HP..."
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table
            loading={loading}
            data={customers}
            columns={[
              { key: "name", label: "Nama", render: (c) => <span className="font-medium">{c.name}</span> },
              { key: "phone", label: "No. HP" },
              { key: "email", label: "Email", render: (c) => c.email || "-" },
              { key: "vehicles", label: "Kendaraan", render: (c) => c._count.vehicles },
              {
                key: "actions", label: "", render: (c) => (
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>Hapus</Button>
                  </div>
                ),
              },
            ]}
            onRowClick={(c) => openEdit(c)}
          />
          <Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Pelanggan" : "Tambah Pelanggan"}>
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: "Nama", field: "name", required: true },
            { label: "No. HP", field: "phone", required: true },
            { label: "Email", field: "email", type: "email" },
            { label: "Alamat", field: "address" },
            { label: "Catatan", field: "notes" },
          ].map(({ label, field, type, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                type={type || "text"} value={(form as any)[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={required}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
