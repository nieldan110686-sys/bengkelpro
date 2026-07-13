"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/ui/table";
import toast from "react-hot-toast";

interface Customer {
  id: string; name: string; phone: string; email?: string; address?: string;
  _count: { vehicles: number; bookings: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers?limit=100")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setCustomers(d.customers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Pelanggan</h1><p className="text-gray-500 mt-1">Kelola data pelanggan bengkel</p></div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={customers}
            emptyMessage="Belum ada data pelanggan. Hubungkan database dan jalankan seed untuk mengisi data demo."
            columns={[
              { key: "name", label: "Nama", render: (c) => <span className="font-medium">{c.name}</span> },
              { key: "phone", label: "No. HP" },
              { key: "email", label: "Email", render: (c) => c.email || "-" },
              { key: "vehicles", label: "Kendaraan", render: (c) => c._count?.vehicles || 0 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
