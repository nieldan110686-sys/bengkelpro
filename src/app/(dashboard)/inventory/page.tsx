"use client";

import { useEffect, useState } from "react";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, Pagination } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string; code: string; name: string; category?: string; brand?: string;
  unit: string; stock: number; minStock: number; sellPrice: number; buyPrice: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [q, setQ] = useState(""); const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", category: "", brand: "", unit: "pcs", stock: 0, minStock: 5, buyPrice: 0, sellPrice: 0, location: "" });
  const [stockForm, setStockForm] = useState({ type: "IN", quantity: 1, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [page, q, lowStock]);

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15", q });
    if (lowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/inventory?${params}`);
    if (res.ok) { const d = await res.json(); setItems(d.inventory); setTotal(d.total); }
    setLoading(false);
  }

  function openCreate() { setEditId(null); setForm({ code: "", name: "", category: "", brand: "", unit: "pcs", stock: 0, minStock: 5, buyPrice: 0, sellPrice: 0, location: "" }); setModalOpen(true); }
  function openEdit(item: InventoryItem) { setEditId(item.id); setForm({ code: item.code, name: item.name, category: item.category || "", brand: item.brand || "", unit: item.unit, stock: item.stock, minStock: item.minStock, buyPrice: item.buyPrice, sellPrice: item.sellPrice, location: "" }); setModalOpen(true); }
  function openStockModal(item: InventoryItem) { setSelectedItem(item); setStockForm({ type: "IN", quantity: 1, notes: "" }); setStockModal(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const url = editId ? `/api/inventory/${editId}` : "/api/inventory";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Gagal"); setSaving(false); return; }
    toast.success(editId ? "Diperbarui" : "Ditambahkan");
    setModalOpen(false); setSaving(false); fetchData();
  }

  async function handleStockUpdate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/inventory/${selectedItem!.id}/stock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stockForm) });
    if (!res.ok) { toast.error("Gagal"); setSaving(false); return; }
    toast.success("Stok diperbarui");
    setStockModal(false); setSaving(false); fetchData();
  }

  async function handleDelete(id: string) { if (!confirm("Hapus?")) return; await fetch(`/api/inventory/${id}`, { method: "DELETE" }); toast.success("Dihapus"); fetchData(); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Inventori</h1><p className="text-gray-500 mt-1">Kelola stok sparepart</p></div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Tambah Barang</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama, kode, kategori..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <Button variant={lowStock ? "danger" : "outline"} size="sm" onClick={() => setLowStock(!lowStock)}>
              <AlertTriangle className="w-4 h-4" />Stok Menipis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table loading={loading} data={items} onRowClick={(i) => openEdit(i)}
            columns={[
              { key: "code", label: "Kode", render: (i) => <span className="font-bold text-xs">{i.code}</span> },
              { key: "name", label: "Nama Barang", render: (i) => <span className="font-medium">{i.name}</span> },
              { key: "category", label: "Kategori", render: (i) => i.category || "-" },
              { key: "stock", label: "Stok", render: (i) => <span className={i.stock <= i.minStock ? "text-red-600 font-bold" : ""}>{i.stock} {i.unit}</span> },
              { key: "sellPrice", label: "Harga Jual", render: (i) => formatCurrency(i.sellPrice) },
              { key: "actions", label: "", render: (i) => (
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openStockModal(i)}>Stok ±</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(i.id)}>Hapus</Button>
                </div>
              )},
            ]}
          />
          <div className="p-4"><Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} /></div>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Barang" : "Tambah Barang"} className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Kode", field: "code", required: true }, { label: "Nama", field: "name", required: true },
              { label: "Kategori", field: "category" }, { label: "Merek", field: "brand" },
              { label: "Satuan", field: "unit" }, { label: "Stok", field: "stock", type: "number" },
              { label: "Stok Min", field: "minStock", type: "number" },
              { label: "Harga Beli", field: "buyPrice", type: "number" }, { label: "Harga Jual", field: "sellPrice", type: "number" },
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

      <Modal open={stockModal} onClose={() => setStockModal(false)} title={`Update Stok: ${selectedItem?.name}`}>
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Tipe</label>
            <select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="IN">Barang Masuk</option><option value="OUT">Barang Keluar</option>
            </select></div>
          <div><label className="block text-sm font-medium mb-1">Jumlah</label>
            <input type="number" min={1} value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })} required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" /></div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setStockModal(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>Update Stok</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
