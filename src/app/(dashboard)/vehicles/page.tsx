"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Vehicle { id: string; brand: string; model: string; year: number; plateNumber: string; vin?: string; customer: { name: string; phone: string }; }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles?limit=100")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setVehicles(d.vehicles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Kendaraan</h1><p className="text-gray-500 mt-1">Data kendaraan pelanggan</p></div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={vehicles}
            emptyMessage="Belum ada data kendaraan. Hubungkan database dan jalankan seed."
            columns={[
              { key: "plateNumber", label: "No. Polisi", render: (v) => <span className="font-bold">{v.plateNumber}</span> },
              { key: "brand", label: "Merek/Model", render: (v) => `${v.brand} ${v.model} (${v.year})` },
              { key: "customer", label: "Pemilik", render: (v) => v.customer?.name || "-" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
