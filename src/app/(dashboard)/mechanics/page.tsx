"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Mechanic { id: string; name: string; email: string; role: string; _count: { workOrders: number }; }

const roleLabels: Record<string, string> = { MECHANIC: "Mekanik", STAFF: "Staf", CASHIER: "Kasir", ADMIN: "Admin" };

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mechanics")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setMechanics(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Mekanik & Staf</h1><p className="text-gray-500 mt-1">Kelola tim bengkel</p></div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={mechanics}
            emptyMessage="Belum ada data mekanik. Hubungkan database dan jalankan seed."
            columns={[
              { key: "name", label: "Nama", render: (m) => <span className="font-medium">{m.name}</span> },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", render: (m) => <Badge>{roleLabels[m.role] || m.role}</Badge> },
              { key: "workOrders", label: "WO", render: (m) => m._count?.workOrders || 0 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
