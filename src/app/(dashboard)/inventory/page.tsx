"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string; code: string; name: string; category?: string; unit: string; stock: number; minStock: number; sellPrice: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory?limit=100")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setItems(d.inventory || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Inventori</h1><p className="text-gray-500 mt-1">Kelola stok sparepart</p></div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={items}
            emptyMessage="Belum ada item inventori. Hubungkan database dan jalankan seed."
            columns={[
              { key: "code", label: "Kode", render: (i) => <span className="font-bold text-xs">{i.code}</span> },
              { key: "name", label: "Nama Barang", render: (i) => <span className="font-medium">{i.name}</span> },
              { key: "category", label: "Kategori", render: (i) => i.category || "-" },
              { key: "stock", label: "Stok", render: (i) => <span className={i.stock <= i.minStock ? "text-red-600 font-bold" : ""}>{i.stock} {i.unit}</span> },
              { key: "sellPrice", label: "Harga Jual", render: (i) => formatCurrency(i.sellPrice) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
