"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface Mechanic {
  id: string; name: string; email: string; phone?: string; role: string;
  _count: { workOrders: number };
}

const roleLabels: Record<string, string> = { MECHANIC: "Mekanik", STAFF: "Staf", CASHIER: "Kasir", ADMIN: "Admin", OWNER: "Owner" };

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "MECHANIC" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() { setLoading(true); const res = await fetch("/api/mechanics"); if (res.ok) setMechanics(await res.json()); setLoading(false); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/mechanics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Gagal"); setSaving(false); return; }
    toast.success("Staf/Mekanik ditambahkan");
    setModalOpen(false); setSaving(false); setForm({ name: "", email: "", phone: "", password: "", role: "MECHANIC" }); fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Mekanik & Staf</h1><p className="text-gray-500 mt-1">Kelola tim bengkel</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Tambah Staf</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={mechanics}
            columns={[
              { key: "name", label: "Nama", render: (m) => <span className="font-medium">{m.name}</span> },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", render: (m) => <Badge className={m.role === "MECHANIC" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>{roleLabels[m.role]}</Badge> },
              { key: "workOrders", label: "WO Selesai", render: (m) => m._count.workOrders },
            ]}
          />
        </CardContent>
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Staf/Mekanik">
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: "Nama", field: "name", required: true }, { label: "Email", field: "email", type: "email", required: true },
            { label: "No. HP", field: "phone" }, { label: "Password", field: "password", type: "password", required: true },
          ].map(({ label, field, type, required }) => (
            <div key={field}><label className="block text-sm font-medium mb-1">{label}</label>
              <input type={type || "text"} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={required}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" /></div>
          ))}
          <div><label className="block text-sm font-medium mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="MECHANIC">Mekanik</option><option value="CASHIER">Kasir</option><option value="STAFF">Staf</option><option value="ADMIN">Admin</option>
            </select></div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
